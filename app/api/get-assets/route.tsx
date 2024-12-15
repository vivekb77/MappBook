import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const MIME_TYPES = {
  json: 'application/json',
  images: 'image/jpeg'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const type = searchParams.get('type')
    
    const basePath = path.join(process.cwd(), 'assets', 'passport')
    const filePath = path.join(basePath, type as string, name as string)

    const content = await fs.readFile(filePath)
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': MIME_TYPES[type as keyof typeof MIME_TYPES],
        'Cache-Control': 'public, max-age=31536000'
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new NextResponse('Error serving asset', { status: 500 })
  }
}