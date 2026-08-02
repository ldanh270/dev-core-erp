export interface AiMessage {
  role: "system" | "user" | "assistant"
  content: string
}

async function callGeminiFallback(prompt: string, isJson: boolean): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey || geminiKey === "your_gemini_api_key") {
    throw new Error("No Gemini API Key available for fallback.")
  }

  console.log("Fallback triggered: Calling Google Gemini API...")
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`

  interface GeminiRequestBody {
    contents: Array<{
      parts: Array<{ text: string }>
    }>
    generationConfig?: {
      responseMimeType: string
    }
  }

  const body: GeminiRequestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  }

  if (isJson) {
    body.generationConfig = {
      responseMimeType: "application/json",
    }
  }

  // 30 seconds timeout for fallback Gemini request
  const controller = new AbortController()
  const timeoutId = setTimeout(() => { controller.abort() }, 30000)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Gemini API error! Status: ${response.status}`)
    }

    interface GeminiResponse {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>
        }
      }>
    }

    const data = (await response.json()) as GeminiResponse
    return data.candidates[0].content.parts[0].text.trim()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY || ""
  const baseURL = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1"
  const model = process.env.AI_MODEL || "google/gemini-2.5-flash"
  return { apiKey, baseURL, model }
}

export const aiClient = {
  generateJson: async <T>(prompt: string, systemPrompt?: string): Promise<T> => {
    const { apiKey, baseURL, model } = getAiConfig()

    let finalPrompt = prompt
    if (!/json/i.test(prompt) && (!systemPrompt || !/json/i.test(systemPrompt))) {
      finalPrompt += "\nReturn valid JSON format."
    }

    const messages: AiMessage[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: finalPrompt })

    let responseText = ""

    // Set 35 seconds timeout for local AI server request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort() }, 35000)

    try {
      console.log(`Calling AI server at ${baseURL} using model ${model}...`)
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.SERVER_URL || "http://localhost:5000",
          "X-Title": "Integrated HR and Product System",
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${body}`)
      }

      interface ChatCompletionResponse {
        choices: Array<{
          message: {
            content: string
          }
        }>
      }

      const resData = (await response.json()) as ChatCompletionResponse
      responseText = resData.choices[0].message.content.trim()
    } catch (err) {
      clearTimeout(timeoutId)
      const error = err as Error
      console.warn("AI JSON call failed, trying fallback to Google Gemini...", error.message)
      try {
        responseText = await callGeminiFallback(prompt, true)
      } catch (fallbackErr) {
        const fallbackError = fallbackErr as Error
        console.error("All AI endpoints failed.", fallbackError.message)
        throw new Error("Không thể kết nối đến cả AI cục bộ và Gemini API.")
      }
    }

    // Clean markdown codeblocks if AI wraps JSON in ```json ... ```
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
    }

    const parsed = JSON.parse(responseText.trim())

    // If an object is returned wrapping an array property (e.g. { tasks: [...] } or { suggestions: [...] }), unwrap it
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed)
      for (const key of keys) {
        if (Array.isArray((parsed as Record<string, unknown>)[key])) {
          return (parsed as Record<string, unknown>)[key] as T
        }
      }
    }

    return parsed as T
  },

  generateText: async (prompt: string, systemPrompt?: string): Promise<string> => {
    const { apiKey, baseURL, model } = getAiConfig()

    const messages: AiMessage[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    let responseText = ""

    // Set 35 seconds timeout for local AI server request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => { controller.abort() }, 35000)

    try {
      console.log(`Calling AI server at ${baseURL} using model ${model}...`)
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.SERVER_URL || "http://localhost:5000",
          "X-Title": "Integrated HR and Product System",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${body}`)
      }

      interface ChatCompletionResponse {
        choices: Array<{
          message: {
            content: string
          }
        }>
      }

      const resData = (await response.json()) as ChatCompletionResponse
      responseText = resData.choices[0].message.content.trim()
    } catch (err) {
      clearTimeout(timeoutId)
      const error = err as Error
      console.warn("AI text call failed, trying fallback to Google Gemini...", error.message)
      try {
        responseText = await callGeminiFallback(prompt, false)
      } catch (fallbackErr) {
        const fallbackError = fallbackErr as Error
        console.error("All AI endpoints failed.", fallbackError.message)
        throw new Error("Không thể kết nối đến cả AI cục bộ và Gemini API.")
      }
    }

    return responseText
  },
}
