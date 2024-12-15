// app/api/asset/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const MIME_TYPES: Record<string, string> = {
  // Images
  images: 'image/jpeg',
  // Data
  data: 'application/json'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')
    const type = searchParams.get('type') // 'images' or 'data'
    
    if (!name || !type) {
      return new NextResponse('Missing parameters', { status: 400 })
    }

    const filePath = path.join(process.cwd(), 'assets', 'passport', type, name)
    const content = await fs.readFile(filePath)
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': MIME_TYPES[type],
      },
    })
  } catch (error) {
    console.error('Asset error:', error)
    return new NextResponse('Error serving asset', { status: 500 })
  }
}