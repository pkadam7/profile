import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(req) {
    try {
        const body = await req.json()
        const { 
            firstName, 
            lastName, 
            skills, 
            fieldOfStudy, 
            educationLevel, 
            university, 
            experienceLevel,
            certificates 
        } = body

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        const certList = certificates && certificates.length > 0
            ? certificates.map(c => c.certificateName).filter(Boolean).join(', ')
            : 'None'

        const prompt = `Write a compelling 700-character career goal statement in first-person for ${firstName} ${lastName}.

Profile details:
- Education: ${educationLevel || 'Not specified'} ${university ? `from ${university}` : ''}
- Field of Study: ${fieldOfStudy || 'Various fields'}
- Skills: ${skills || 'Multiple skills'}
- Experience Level: ${experienceLevel || 'Entry level'}
- Certificates: ${certList}

Requirements:
- Write in first-person (use "I")
- Be inspiring and forward-looking
- Focus on career aspirations and growth
- Keep it under 700 characters
- Sound professional yet passionate
- Highlight how their skills and education align with their goals

Do not use phrases like "As a [role]" or start with "I am a". Instead, focus on aspirations and goals.`

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        return NextResponse.json({ bio: text })
    } catch (error) {
        console.error("AI Generation Error:", error)
        
        if (error.message?.includes('API key')) {
            return NextResponse.json({ 
                error: "API key configuration error. Please check your environment variables." 
            }, { status: 500 })
        }
        
        return NextResponse.json({ 
            error: "Failed to generate bio. Please try again." 
        }, { status: 500 })
    }
}