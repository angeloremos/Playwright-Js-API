import { expect } from '@playwright/test'

class Verifications {

	verifyEquals(firstValue, secondValue) {
		try {
			expect(firstValue).toEqual(secondValue)
		} catch (error) {
			throw new Error(firstValue + " and " + secondValue + " are not equal")
		}
	}

    verifyContains(container, value) {
		try {
			expect(container).toContain(value)
		} catch (error) {
			throw new Error(value + " not found on " + container)
		}
	}

	verifyNotContains(container, value) {
		try {
			expect(container).not.toContain(value)
		} catch (error) {
			throw new Error(value + " found on " + container)
		}
	}

    verifyisTrue(value) {
		try {
			expect(value).toBeTruthy()
		} catch (error) {
			throw new Error("value is false")
		}
	}

    verifyisFalse(value) {
		try {
			expect(value).toBeFalsy()
		} catch (error) {
			throw new Error("value is true")
		}
	}

    verifyIsNull(value) {
		try {
			expect(value).toBeNull()
		} catch (error) {
			throw new Error("value is not null")
		}
	}

	verifyIsNotNull(value){
		try {
			expect(value).not.toBeNull()
		} catch (error) {
			throw new Error("value is null")
		}
	}

    verifyLength(value, length){
		try {
			expect(value).toHaveLength(length)
		} catch (error) {
			throw new Error(value + " length is not equal to " + length)
		}
    }

    verifyHasObject(obj, value){
		try {
			expect(obj).toMatchObject(value)
		} catch (error) {
			throw new Error(value + " not found on " + obj)
		}
    }
}
export default Verifications