import { request } from '@playwright/test'
import Utility from '../utility/utility'
import { getServiceUrl } from '../dataobjects/config.js'

class ApiRequest {
    constructor(APIRequestContext) {
        this.APIRequestContext = APIRequestContext
        this.response = null
        this.responseBody = null
    }

    async useService(serviceName) {
        if (this.APIRequestContext) {
            await this.APIRequestContext.dispose();
        }
        const baseURL = getServiceUrl(serviceName);
        this.APIRequestContext = await request.newContext({
            baseURL,
        });
    }

    async sendRequest(method, endpoint = '', headers = {}, queryParams = {}, body = null) {
        const finalHeaders = this._buildHeaders(headers);
        let response;

        switch (method.toUpperCase()) {
            case 'GET':
                response = await this.APIRequestContext.get(endpoint, {
                    headers: finalHeaders,
                    params: queryParams
                });
                break;
            case 'POST':
                response = await this.APIRequestContext.post(endpoint, {
                    headers: finalHeaders,
                    params: queryParams,
                    data: body
                });
                break;
            case 'PUT':
                response = await this.APIRequestContext.put(endpoint, {
                    headers: finalHeaders,
                    params: queryParams,
                    data: body
                });
                break;
            case 'PATCH':
                response = await this.APIRequestContext.patch(endpoint, {
                    headers: finalHeaders,
                    params: queryParams,
                    data: body
                });
                break;
            case 'DELETE':
                response = await this.APIRequestContext.delete(endpoint, {
                    headers: finalHeaders,
                    params: queryParams,
                    data: body
                });
                break;
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }

        Utility.logApiDetails(method.toUpperCase(), endpoint, finalHeaders, body, await response.status(), await response.json())
        this.response = response
        this.responseBody = await response.json()
        return response
    }

    async sendApiRequest(method, endpoint, data) {
        let finalEndpoint = endpoint;
        if (data.pathParams) {
            for (const [key, value] of Object.entries(data.pathParams)) {
                finalEndpoint = finalEndpoint.replace(`{${key}}`, value);
            }
        }
        await this.sendRequest(method, finalEndpoint, data.headers, data.params, data.body);
    }

    _normalizeHeaderKeys(headers = {}) {
        const normalized = {};
        for (const [key, value] of Object.entries(headers)) {
            const normalizedKey = key.replace(/_/g, '-');
            normalized[normalizedKey] = value;
        }
        return normalized;
    }

    _buildHeaders(headers = {}) {
        return this._normalizeHeaderKeys(headers);
    }
}

export default ApiRequest
