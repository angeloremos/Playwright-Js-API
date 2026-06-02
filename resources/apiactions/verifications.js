import { expect } from '@playwright/test'

class Verifications {

    async verifyStatusCode(response, expectedCode) {
        const actualCode = response.status();
        expect(actualCode).toBe(expectedCode);
    }

    async verifyResponseBodyProperty(responseBody, key, expectedValue) {
        expect(responseBody[key]).toBe(expectedValue);
    }

    async verifyResponseBodyContains(responseBody, expectedKeyValues) {
        for (const [key, value] of Object.entries(expectedKeyValues)) {
            expect(responseBody[key]).toBe(value);
        }
    }

    async verifyResponseBodyHasKey(responseBody, key) {
        expect(responseBody).toHaveProperty(key);
    }

    async verifyResponseBodyIsArray(responseBody) {
        expect(Array.isArray(responseBody)).toBeTruthy();
    }

    async verifyResponseBodyArrayLength(responseBody, expectedLength) {
        expect(responseBody.length).toBe(expectedLength);
    }

    async verifyResponseExactMatch(actualResponseBody, expectedResponse) {
        expect(actualResponseBody).toEqual(expectedResponse);
    }
}

export default new Verifications();
