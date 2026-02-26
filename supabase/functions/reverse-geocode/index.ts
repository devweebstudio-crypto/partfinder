// @ts-nocheck
// deno-lint-ignore-file
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

interface ReverseGeocodeRequest {
  lat: number
  lng: number
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { lat, lng } = (await req.json()) as ReverseGeocodeRequest
    
    if (!lat || !lng) {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Call Nominatim with proper User-Agent header
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=10`,
      {
        headers: {
          'User-Agent': 'PartFinder-App (https://github.com/partfinder)',
        },
      }
    )

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
