import jiraService from './jira.service.js'

/**
 * Custom Playwright Reporter for Jira Integration
 * Automatically creates Jira bug tickets when tests fail
 */
class JiraReporter {
    constructor(options = {}) {
        this.options = options
    }

    /**
     * Called when a test ends
     * This is where we check for failures and create Jira tickets
     */
    onTestEnd(test, result) {
        // Only process failed tests
        if (result.status !== 'failed') {
            return
        }

        // Check if Jira integration is enabled
        if (!jiraService.enabled) {
            return
        }

        console.log(`\n[Jira Reporter] Test failed: ${test.title}`)

        // Collect test failure information
        const testInfo = this.collectTestInfo(test, result)

        // Create Jira ticket (async, non-blocking)
        jiraService.createBugTicket(testInfo).catch(error => {
            console.error(`[Jira Reporter] Failed to create Jira ticket: ${error.message}`)
        })
    }

    /**
     * Collect all relevant test information for Jira ticket
     */
    collectTestInfo(test, result) {
        const testName = test.title
        
        // Get error information
        const error = result.error
        const errorMessage = error?.message || 'No error message available'
        const stackTrace = error?.stack || ''

        // Get browser/project information
        const browser = test.parent?.project()?.name || 'unknown'

        // Get test file path
        const testFile = test.location?.file || test.parent?.location?.file || 'unknown'

        // Get environment from .env
        const environment = process.env.environment || 'unknown'
        const region = process.env.region || 'unknown'

        // Get timestamp
        const timestamp = new Date().toISOString()

        // Get artifact paths (screenshots, videos)
        const screenshotPath = this.getScreenshotPath(result)
        const videoPath = this.getVideoPath(result)

        return {
            testName,
            errorMessage,
            stackTrace,
            browser,
            testFile,
            environment: `${environment} (${region})`,
            timestamp,
            screenshotPath,
            videoPath
        }
    }

    /**
     * Get screenshot path from test results
     */
    getScreenshotPath(result) {
        if (result.attachments) {
            const screenshot = result.attachments.find(
                attachment => attachment.name === 'screenshot' || 
                              attachment.contentType?.startsWith('image/')
            )
            return screenshot?.path || null
        }
        return null
    }

    /**
     * Get video path from test results
     */
    getVideoPath(result) {
        if (result.attachments) {
            const video = result.attachments.find(
                attachment => attachment.name === 'video' || 
                              attachment.contentType?.startsWith('video/')
            )
            return video?.path || null
        }
        return null
    }

    /**
     * Called when all tests have finished
     */
    onEnd(result) {
        if (jiraService.enabled) {
            console.log('\n[Jira Reporter] Test run completed. Check Jira for any created tickets.')
        }
    }

    /**
     * Called when a test starts (optional, for logging)
     */
    onTestBegin(test) {
        // Optionally log test start
        // console.log(`[Jira Reporter] Test started: ${test.title}`)
    }

    /**
     * Called at the beginning of the test run
     */
    onBegin(config, suite) {
        if (jiraService.enabled) {
            console.log('[Jira Reporter] Jira integration is enabled')
            console.log(`[Jira Reporter] Project Key: ${jiraService.projectKey}`)
            console.log(`[Jira Reporter] Base URL: ${jiraService.baseUrl}`)
        } else {
            console.log('[Jira Reporter] Jira integration is disabled')
        }
    }

    /**
     * Called when an error occurs in the reporter itself
     */
    onError(error) {
        console.error(`[Jira Reporter] Reporter error: ${error.message}`)
    }

    /**
     * Called when a step starts
     */
    onStepBegin(test, result, step) {
        // Not used for this reporter
    }

    /**
     * Called when a step ends
     */
    onStepEnd(test, result, step) {
        // Not used for this reporter
    }

    /**
     * Called when a suite starts
     */
    onSuiteBegin(suite) {
        // Not used for this reporter
    }

    /**
     * Called when a suite ends
     */
    onSuiteEnd(suite) {
        // Not used for this reporter
    }

    /**
     * Called when stdout is produced
     */
    onStdOut(chunk, test, result) {
        // Not used for this reporter
    }

    /**
     * Called when stderr is produced
     */
    onStdErr(chunk, test, result) {
        // Not used for this reporter
    }

    /**
     * Called before a test is retried
     */
    onTestBegin(test, result) {
        // Not used for this reporter
    }
}

// Export the reporter class
export default JiraReporter