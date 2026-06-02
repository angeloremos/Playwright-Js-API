import { test as fixture } from '@playwright/test'
import ApiRequest from '../resources/apiactions/base.js'

const apitest = fixture.extend({
    api: async ({ request }, use) => {
        await use(new ApiRequest(request))
    }
})

export default apitest
