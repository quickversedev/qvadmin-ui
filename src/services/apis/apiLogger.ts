// src/services/apis/apiLogger.ts
// Logs API request and response details in pretty JSON format

export interface ApiLogParams {
  url: string;
  method: string;
  body?: any;
  response?: any;
}

export function logApi({url, method, body, response}: ApiLogParams) {
  // Log request
  console.log('\n--- API REQUEST ---');
  console.log('URL:', url);
  console.log('Method:', method);
  if (body !== undefined) {
    try {
      console.log('Body:', JSON.stringify(body, null, 2));
    } catch {
      console.log('Body:', body);
    }
  }
  // Log response
  if (response !== undefined) {
    try {
      console.log('--- API RESPONSE ---');
      console.log('Response:', JSON.stringify(response, null, 2));
    } catch {
      console.log('Response:', response);
    }
  }
  console.log('-------------------\n');
}
