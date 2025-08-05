import { Request, Response } from "express";

import OpenAI from "openai";
import config from "../config";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const processImageSchema = z.object({
  api_key: z.string().optional().nullable(),
  secret: z.string().optional().nullable(),
  category: z.array(z.string()),
  image: z.string(),
  mode: z.enum(["record"]),
  account: z.array(z.object({
    name: z.string(),
    currency: z.string(),
    note: z.string().optional().nullable(),
  })),
  custom_prompt: z.string().optional().nullable(),
});

const resultSchema = z.array(z.object({
  type: z.enum(["expense", "transfer", "income"]),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  time: z.string(),
  category: z.string(),
  note: z.string().optional().nullable(),
  transfer_to: z.string().optional().nullable(),
}));

let [date, time] = new Date().toISOString().split("T");
time = time.split(".")[0].slice(0, 5);

const modePrompt = {
  record: `You will be given an image of expenses, there can be one or more income/expense items in the image.

  You need to process the image and return the result in JSON format.

  The result should be a list of objects, each object contains the following fields:
  
  type: "expense" | "transfer" | "income" // required, the type of the item, if not detected, use "expense"
  amount: number // required, if not detected, use 0, always positive
  currency: string // one of the currencies in the accounts list
  date: string // required, format: YYYY-MM-DD, if not detected, use ${date}
  time: string // required, format: HH:MM, if not detected, use ${time}
  category: string // one of the categories in the categories list
  note: string // optional, description of the expense or income
  warning: string // optional, warning message if you think the image is not clear or the data may be wrong, beware, you still need to return the result, but you can use this field to tell the user that the image is not clear or the data may be wrong, like "The image is not clear, result may be wrong" or "We can't determine the category, please double check the result"
  transfer_to: string // optional, the account name to transfer to, fill in if the amount is transferred to another account, like Deposit or Withdraw.
  
  Example:
  [
    {
      type: "expense",
      amount: 49.9,
      date: "2025-01-01",
      time: "10:00",
      category: "Food",
      note: "Lunch at KFC",
      warning: null,
      transfer_to: null
    },
    {
      type: "transfer",
      amount: 100,
      date: "2025-01-01",
      time: "21:36",
      category: null, // if it is transfer, the category should be null
      note: "Deposit to ZA Bank 6605",
      warning: null,
      transfer_to: "ZA Bank 6605" // It should be the account name in the accounts list
    }
  ]
  `
}
export async function processImage(req: Request, res: Response) {
  try {
    const { api_key, secret, category, image, mode, account, custom_prompt } = processImageSchema.parse(req.body);

    if (secret && secret !== config.api_secret) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
      });
    }

    if (!secret && !api_key) {
      return res.status(401).json({
        success: false,
        error: "API key is required if secret is not provided",
      });
    }

    if (!api_key && !config.openai.apiKey) {
      return res.status(401).json({
        success: false,
        error: "Please configure the server's OpenAI API key in the config.ts file",
      });
    }

    if (!secret && !config.allow_user_provide_api_key) {
      return res.status(401).json({
        success: false,
        error: "This server does not allow user to provide API key, if you own the server, please configure the server's allow_user_provide_api_key in the config.ts file",
      });
    }

    const client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL,
    });

    const prompt = `You are a helpful assistant that can help me process my expenses.

    ${modePrompt[mode]}

    Categories: ${category.join(", ")}
    Accounts: ${account.map((item) => `${item.name} (${item.currency})${item.note ? `, Note: ${item.note}` : ""}
      
    Today is ${date}, current time is ${time}, please use this time to determine the date and time of the bill if it is not clear.`).join(", ")}
    
    ${custom_prompt ? `\nAdditional Instructions: ${custom_prompt}` : ""}`;

    // Generate email using OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here is the image of my expenses`
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high",
              },
            },
          ]
        },
      ],
      // response_format: zodResponseFormat(resultSchema, "result"),
    });

    // Get result
    let result = completion.choices[0]?.message?.content;
    if (!result) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate result",
      });
    }

    console.log("Generated result:", result);

    try {
      const parsedResult = JSON.parse(result.replace(/```(json)?/g, "").replaceAll("\n", ""));

      res.json({
        success: true,
        result: parsedResult,
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      res.status(500).json({
        success: false,
        error: "Failed to parse generated email content",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request body",
        details: error.errors
      });
    }

    console.error("Email generation error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}
