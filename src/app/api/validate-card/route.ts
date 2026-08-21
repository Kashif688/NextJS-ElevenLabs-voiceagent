import { NextRequest, NextResponse } from 'next/server';
import { validateCard, validateExpiry, sanitizeCardNumber } from '@/lib/utils/cardValidator';

export const dynamic = 'force-dynamic';

interface ValidateCardPayload {
  cardNumber?: string | number;
  card_number?: string | number;
  card?: string | number;
  number?: string | number;
  expMonth?: string | number;
  exp_month?: string | number;
  expYear?: string | number;
  exp_year?: string | number;
  cvv?: string | number;
  cardholderName?: string;
}

function handleValidation(payload: ValidateCardPayload) {
  // Extract card number from any common field name used by LLMs/callers
  const rawCard = payload.cardNumber ?? payload.card_number ?? payload.card ?? payload.number;

  if (!rawCard) {
    return {
      status: 400,
      body: {
        success: false,
        valid: false,
        errorReason: 'MISSING_CARD_NUMBER',
        message: 'Please provide a card number to validate (e.g., {"cardNumber": "4111 2222 3333 4444"}).',
      },
    };
  }

  // 1. Primary validation: Card number + Brand + Luhn Checksum
  const cardResult = validateCard(rawCard);

  // 2. Optional validation: Expiry date (if provided)
  const expMonth = payload.expMonth ?? payload.exp_month;
  const expYear = payload.expYear ?? payload.exp_year;
  const expiryResult = validateExpiry(expMonth, expYear);

  if (!cardResult.valid) {
    return {
      status: 200, // Return 200 so ElevenLabs agent tools can read the response message directly
      body: {
        success: true,
        valid: false,
        brand: cardResult.brandName,
        maskedCard: cardResult.maskedCard,
        last4: cardResult.last4,
        errorReason: cardResult.errorReason,
        message: cardResult.message,
      },
    };
  }

  if (!expiryResult.valid) {
    return {
      status: 200,
      body: {
        success: true,
        valid: false,
        brand: cardResult.brandName,
        maskedCard: cardResult.maskedCard,
        last4: cardResult.last4,
        errorReason: 'EXPIRED_CARD',
        message: `${cardResult.message} However, ${expiryResult.message}`,
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      valid: true,
      brand: cardResult.brandName,
      maskedCard: cardResult.maskedCard,
      last4: cardResult.last4,
      message: cardResult.message,
    },
  };
}

/**
 * POST /api/validate-card
 * Primary webhook/tool endpoint for ElevenLabs Agent and client-side forms
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidateCardPayload = await request.json().catch(() => ({}));
    const result = handleValidation(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    console.error('Error validating card:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        errorReason: 'SERVER_ERROR',
        message: error.message || 'An unexpected error occurred while validating the card.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/validate-card?cardNumber=4111222233334444
 * Convenience endpoint for GET requests or browser testing
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const cardNumber = searchParams.get('cardNumber') || searchParams.get('card_number') || searchParams.get('card') || searchParams.get('number');
  const expMonth = searchParams.get('expMonth') || searchParams.get('exp_month') || undefined;
  const expYear = searchParams.get('expYear') || searchParams.get('exp_year') || undefined;

  const result = handleValidation({
    cardNumber: cardNumber || undefined,
    expMonth,
    expYear,
  });

  return NextResponse.json(result.body, { status: result.status });
}
