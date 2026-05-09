import { NextResponse } from 'next/server';

/**
 * Return a success JSON response.
 * Shape: { data: T, error: null }
 */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

/**
 * Return a failure JSON response.
 * Shape: { data: null, error: "message" }
 */
export function failure(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}
