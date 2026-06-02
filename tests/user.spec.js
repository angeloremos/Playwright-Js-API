import apitest from '../fixtures/api.fixture.js';
import Verifications from '../resources/apiactions/verifications.js';
import { testData } from '../resources/data/test/user.js';
import { endpoints } from '../resources/data/constant/endpoints.js';

apitest('TC01 - Get API Users With Role Admin', async ({ api }) => {
    await api.sendApiRequest('GET', endpoints.users, testData.tc01);
    await Verifications.verifyStatusCode(api.response, 200);
    await Verifications.verifyResponseBodyContains(api.responseBody, {
        success: true,
        message: 'Users retrieved successfully.'
    });
});

apitest('TC02 - Get API Users With Role Admin Filtered', async ({ api }) => {
    await api.sendApiRequest('GET', endpoints.users, testData.tc02);
    await Verifications.verifyStatusCode(api.response, 200);
    await Verifications.verifyResponseBodyContains(api.responseBody, {
        success: true,
        message: 'Users retrieved successfully.'
    });
    await Verifications.verifyResponseBodyProperty(api.responseBody.data[0], 'role', 'admin');
});

apitest('TC03 - Create User', async ({ api }) => {
    await api.sendApiRequest('POST', endpoints.users, testData.tc03);
    await Verifications.verifyStatusCode(api.response, 201);
    await Verifications.verifyResponseBodyContains(api.responseBody, {
        success: true,
        message: 'User created successfully.'
    });
});

apitest('TC04 - Get User By ID', async ({ api }) => {
    await api.sendApiRequest('GET', endpoints.userById, testData.tc04);
    await Verifications.verifyStatusCode(api.response, 200);
    await Verifications.verifyResponseExactMatch(api.responseBody, testData.tc04.response);
});
