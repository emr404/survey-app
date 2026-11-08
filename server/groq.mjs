import validation from '../shared/validation.js';
// Groq can reject an otherwise valid shortlist when it emits a fifth match reason.
function parseOutput(text) {
  if (typeof text !== 'string' || text.length > 100000) throw new Error('Incomplete output');
  const result = JSON.parse(text, (_key, value) => typeof value === 'string' ? value.replace(/\s*\u2014\s*/g, ', ') : value);
  if (Array.isArray(result?.destinations)) {
    const schema = validation.contracts.destination.properties.matchReasons;
    for (const destination of result.destinations) {
      const reasons = destination?.matchReasons;
      if (Array.isArray(reasons) && reasons.length > schema.maxItems && reasons.every(reason => validation.matches(reason, schema.items))) {
        destination.matchReasons = reasons.slice(0, schema.maxItems);
      }
    }
  }
  return result;
}
const fail = (status, message, code) => Object.assign(new Error(message), { status, code });
export async function groqOutput(input, instructions, options = {}, signal) {
  const { groqKey, groqModel = 'openai/gpt-oss-20b', fetchImpl = fetch } = options;
  if (!groqKey) throw fail(503, 'Add GROQ_API_KEY to .env.local and restart the API.', 'groq_not_configured');
  const schema = structuredClone(validation.contracts.recommendations);
  delete schema.properties.destinations.items.properties.matchReasons.maxItems;
  let response;
  try {
    response = await fetchImpl('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(55000)]) : AbortSignal.timeout(55000),
      body: JSON.stringify({ model: groqModel, reasoning_effort: 'low', max_completion_tokens: 4000,
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: JSON.stringify(input) }],
        response_format: { type: 'json_schema', json_schema: { name: 'recommendations', strict: true, schema } },
      }),
    });
  } catch (error) {
    if (signal?.aborted) throw fail(499, 'Request cancelled.', 'request_cancelled');
    if (['TimeoutError', 'AbortError'].includes(error.name)) throw fail(504, 'Your recommendations took too long. Your preferences are saved. Please retry.', 'groq_timeout');
    throw fail(502, 'Could not reach the recommendation service. Please retry.', 'groq_unavailable');
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    if (problem?.error?.code === 'json_validate_failed') {
      // Older/provider-side schemas may still reject a harmless extra reason.
      // A failed generation is usable only after full application validation.
      try {
        const repaired = parseOutput(problem.error.failed_generation);
        if (validation.validRecommendations(repaired) && repaired.destinations.every(destination => validation.visaAdviceMatchesPreferences(destination.visaAdvice, input.preferences))) return repaired;
      } catch { /* Preserve the sanitised error if output cannot be repaired safely. */ }
      throw fail(502, 'The response did not meet the required format. Your preferences are saved. Please try again.', 'groq_invalid_response');
    }
    if (response.status === 429) throw fail(503, 'The free request limit has been reached. Wait a moment and try again. Your preferences are saved.', 'groq_rate_limit');
    if ([401, 403].includes(response.status)) throw fail(502, 'The server API key was rejected. Check GROQ_API_KEY and restart the API.', 'groq_authentication');
    if ([400, 404].includes(response.status)) throw fail(502, 'The recommendation model configuration was rejected. Check GROQ_MODEL on the server.', 'groq_configuration');
    throw fail(502, 'The recommendation service is temporarily unavailable. Please retry.', 'groq_unavailable');
  }
  try {
    const data = await response.json();
    const choice = data.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') throw new Error();
    return parseOutput(choice.message.content);
  } catch { throw fail(502, 'The response was incomplete. Please retry. Your earlier results are saved.', 'groq_invalid_response'); }
}
