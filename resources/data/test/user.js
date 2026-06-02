import { getToken } from '../../dataobjects/config.js';

const token = getToken();
const defaultHeaders = {
    Content_Type: "application/json",
    Authorization: token
    }

const testData = {
    tc01: {
        headers: defaultHeaders,
        params: {},
        body: null
    },
    tc02: {
        headers: defaultHeaders,
        params: { role: 'admin' },
        body: null
    },
    tc03: {
        headers: defaultHeaders,
        params: {},
        body: {
            name: 'Marks',
            email: 'newuser@example.com',
            role: 'user',
            department: 'Engineering'
        }
    },
    tc04: {
        headers: defaultHeaders,
        pathParams: { id: '2' },
        params: {},
        body: null,
        response: {
            "success": true,
            "message": "User retrieved successfully.",
            "data": {
              "id": 2,
              "name": "Jane Smith",
              "email": "jane@example.com",
              "role": "user",
              "department": "Marketing"
            }
        }
    }
};

export { testData }
