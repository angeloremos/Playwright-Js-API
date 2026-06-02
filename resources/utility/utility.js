import { getApiBaseUrl } from '../dataobjects/config'
class Utility {

	generateRandomChar(length){
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    	let result = ''
		for (let i = 0; i < length; i++) {
        	const randomIndex = Math.floor(Math.random() * characters.length)
        	result += characters.charAt(randomIndex)
    	}
    	return result;
	}

	generateRandomNumber(min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	generateRandomIpAddress(){
		const characters = '123456789'
    	let ipAddress = '192.168.'
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 2; j++) {
				const randomIndex = Math.floor(Math.random() * characters.length)
				ipAddress += characters.charAt(randomIndex)
			}
			ipAddress += "."
		}
    	return ipAddress.slice(0, -1)
	}

	verifyOrder(order, data){
		if (order == "ascending" ){
		  expect(data.toString()).to.eq(data.sort(function(a, b){return a - b}).toString())
		} else if (order == "descending" ) {
		  expect(data.toString()).to.eq(data.sort(function(a, b){return a - b}).reverse().toString())
		}
	  }
	
	getDateToday(format){
		const currentDate = new Date();
		const dd = String(currentDate.getDate()).padStart(2, '0');
		const mm = String(currentDate.getMonth() + 1).padStart(2, '0'); 
		const yyyy = currentDate.getFullYear();
		switch (format){
			case "shortDate":
				var today = mm + '/' + dd + '/' + yyyy;
				break
			case "YYYY-MM-DD":
				var today = yyyy + '-' + mm + '-' + dd;
				break
			case "mmddyyyy":
				var today = mm + dd + yyyy;
				break
			default:
				var today = "Invalid format";
		}
		return today
	}

	_maskTokens(obj){
		if (typeof obj !== 'object' || obj === null) return obj
		const tokenKeys = ['authorization', 'token', 'access_token', 'refresh_token', 'bearer', 'api_key', 'apikey']
		const masked = {}
		for (const [key, value] of Object.entries(obj)) {
			if (tokenKeys.includes(key.toLowerCase())) {
				masked[key] = '*****'
			} else if (typeof value === 'object' && value !== null) {
				masked[key] = this._maskTokens(value)
			} else {
				masked[key] = value
			}
		}
		return masked
	}

	logApiDetails(method, endpoint, headers, requestBody, responseStatus, responseBody){
		const baseUrl = getApiBaseUrl()
		console.log('----------------------------------------------------')
		console.log(`REQUEST URL: ${method} ${baseUrl}${endpoint}`, '\n')
		let maskedHeaders = this._maskTokens(headers)
		let jsonHeaders = JSON.stringify(maskedHeaders, null, 2)
		console.log(`HEADERS: ${jsonHeaders}`, '\n')
		let jsonRequestBody = JSON.stringify(requestBody, null, 2)
		console.log(`REQUEST BODY: ${jsonRequestBody}`, '\n')
		console.log(`RESPONSE STATUS: ${responseStatus}`, '\n')
		let jsonResponseBody = JSON.stringify(responseBody, null, 2)
		console.log(`RESPONSE BODY: ${jsonResponseBody}`, '\n')
	}
}

export default new Utility();