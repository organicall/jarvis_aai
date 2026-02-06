export const aiSchemaPrompt = `You must respond with valid JSON only. You are parsing a UK financial advisor's client document.
Extract ALL relevant information and return ONLY a JSON object matching the schema below.

Return JSON with this shape:
{
  "client": {
    "client_id": "string or null",
    "client_name": "string",
    "adviser_name": "string or null",
    "combined_income": "number or null",
    "net_worth": "number or null",
    "last_updated": "YYYY-MM-DD or null",
    "next_review_date": "YYYY-MM-DD or null",
    "isa_allowance_remaining": "number or null"
  },
  "personal_details": { "text": "string", "people": [{"name":"string","age":number|null,"occupation":"string"}] },
  "financial_summary": { "text": "string" },
  "assets": { "text": "string", "items": ["string"] },
  "pensions": { "text": "string", "items": ["string"] },
  "protection": { "text": "string", "gaps": ["string"] },
  "goals": ["string"],
  "recommendations": ["string"],
  "opportunities": ["string"],
  "risks": ["string"],
  "recent_changes": ["string"],
  "tax_position": { "text": "string" },
  "communication_log": ["string"],
  "urgent_items": ["string"]
}

Rules:
- Return ONLY valid JSON.
- Convert currency to numbers WITHOUT commas or symbols (e.g., £2.85m → 2850000, NOT 2,850,000).
- ALL numeric values must be plain integers or decimals with NO commas, spaces, or formatting.
- Dates must be ISO (YYYY-MM-DD) if known.
- If client_id missing, set null.
- Use null for unknown numbers or dates.
- If a section is missing, return empty array or empty object.
`;
