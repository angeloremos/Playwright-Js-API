import 'dotenv/config'

/**
 * Jira Service - Handles all Jira API interactions
 * Supports Jira on-premise with Basic Authentication
 */
class JiraService {
    constructor() {
        this.enabled = process.env.JIRA_ENABLED?.toLowerCase() === 'true'
        this.baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, '') // Remove trailing slash
        this.email = process.env.JIRA_EMAIL
        this.apiToken = process.env.JIRA_API_TOKEN
        this.projectKey = process.env.JIRA_PROJECT_KEY
        this.defaultAssignee = process.env.JIRA_DEFAULT_ASSIGNEE || null
        this.authHeader = this.generateAuthHeader()
    }

    /**
     * Generate Bearer Token Authentication header
     * For Jira on-premise with Personal Access Token (PAT)
     */
    generateAuthHeader() {
        if (!this.apiToken) {
            return null
        }
        // Use Bearer token authentication for Personal Access Token
        return `Bearer ${this.apiToken}`
    }

    /**
     * Check if Jira integration is properly configured
     */
    isConfigured() {
        return this.enabled && 
               this.baseUrl && 
               this.apiToken && 
               this.projectKey
    }

    /**
     * Make authenticated request to Jira API
     */
    async makeRequest(endpoint, method = 'GET', body = null) {
        if (!this.isConfigured()) {
            console.log('[Jira] Integration not configured or disabled')
            return null
        }

        const url = `${this.baseUrl}/rest/api/2${endpoint}`
        const headers = {
            'Authorization': this.authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        const options = {
            method,
            headers
        }

        if (body) {
            options.body = JSON.stringify(body)
        }

        try {
            const response = await fetch(url, options)
            
            if (!response.ok) {
                const errorText = await response.text()
                console.error(`[Jira] API Error: ${response.status} - ${errorText}`)
                return null
            }

            // Handle empty responses (204 No Content)
            if (response.status === 204) {
                return { success: true }
            }

            return await response.json()
        } catch (error) {
            console.error(`[Jira] Request failed: ${error.message}`)
            return null
        }
    }

    /**
     * Search for existing Jira ticket with the same test case name
     * Returns the existing ticket if found, null otherwise
     */
    async findExistingTicket(testName) {
        // Search for issues with the same summary in the project
        // Exclude closed/done issues using statusCategory != Done
        const jql = `project = "${this.projectKey}" AND summary ~ "\\"${testName}\\"" AND statusCategory != Done ORDER BY created DESC`
        const encodedJql = encodeURIComponent(jql)
        
        const result = await this.makeRequest(`/search?jql=${encodedJql}&fields=key,summary,status&maxResults=5`)
        
        if (result && result.issues && result.issues.length > 0) {
            // Return the most recent matching issue
            return result.issues[0]
        }
        
        return null
    }

    /**
     * Add a comment to an existing Jira ticket
     */
    async addComment(issueKey, comment) {
        const body = {
            body: comment
        }
        
        const result = await this.makeRequest(`/issue/${issueKey}/comment`, 'POST', body)
        
        if (result) {
            console.log(`[Jira] Comment added to existing ticket: ${issueKey}`)
            return true
        }
        
        return false
    }

    /**
     * Create a new Jira bug ticket
     */
    async createBugTicket(testInfo) {
        if (!this.isConfigured()) {
            console.log('[Jira] Skipping ticket creation - integration not configured')
            return null
        }

        const { testName, errorMessage, stackTrace, browser, testFile, environment, timestamp, screenshotPath, videoPath } = testInfo

        // Check for existing ticket
        const existingTicket = await this.findExistingTicket(testName)
        
        if (existingTicket) {
            console.log(`[Jira] Found existing ticket: ${existingTicket.key}`)
            
            // Add comment with new failure details
            const comment = this.formatComment(testInfo)
            await this.addComment(existingTicket.key, comment)
            
            return existingTicket.key
        }

        // Create new ticket
        const summary = `[Test Failure] ${testName}`
        const description = this.formatDescription(testInfo)

        const issueData = {
            fields: {
                project: {
                    key: this.projectKey
                },
                summary: summary,
                description: description,
                issuetype: {
                    name: 'Bug'
                },
                priority: {
                    name: 'Medium'
                },
                labels: ['automated-test', 'test-failure']
            }
        }

        // Add assignee if configured
        if (this.defaultAssignee) {
            issueData.fields.assignee = {
                name: this.defaultAssignee
            }
        }

        const result = await this.makeRequest('/issue', 'POST', issueData)

        if (result && result.key) {
            console.log(`[Jira] New bug ticket created: ${result.key}`)
            
            // Add attachments if available
            if (screenshotPath || videoPath) {
                console.log(`[Jira] Note: Screenshots and videos are available at: test-results/`)
                // Attachments would require multipart/form-data which is more complex
                // For now, we log the path in the description
            }
            
            return result.key
        }

        return null
    }

    /**
     * Format the description for a new bug ticket
     */
    formatDescription(testInfo) {
        const { testName, errorMessage, stackTrace, browser, testFile, environment, timestamp, screenshotPath, videoPath } = testInfo
        
        let description = `{panel:title=Test Failure Details|borderStyle=solid|borderColor=#ccc|titleBGColor=#F7D6C1|bgColor=#FFFFCE}\n`
        description += `*Test Name:* ${testName}\n`
        description += `*Environment:* ${environment}\n`
        description += `*Browser:* ${browser}\n`
        description += `*Test File:* ${testFile}\n`
        description += `*Timestamp:* ${timestamp}\n`
        description += `{panel}\n\n`
        
        description += `h2. Error Message\n`
        description += `{code:java}\n`
        description += `${errorMessage || 'No error message available'}\n`
        description += `{code}\n\n`
        
        if (stackTrace) {
            description += `h2. Stack Trace\n`
            description += `{code:java}\n`
            description += `${this.truncateStackTrace(stackTrace)}\n`
            description += `{code}\n\n`
        }

        if (screenshotPath || videoPath) {
            description += `h2. Attachments\n`
            if (screenshotPath) {
                description += `* Screenshot: ${screenshotPath}\n`
            }
            if (videoPath) {
                description += `* Video: ${videoPath}\n`
            }
            description += `\n`
        }
        
        description += `----\n`
        description += `*This ticket was automatically created by the Playwright Test Framework.*\n`
        
        return description
    }

    /**
     * Format a comment for an existing ticket (new failure occurrence)
     */
    formatComment(testInfo) {
        const { testName, errorMessage, browser, environment, timestamp, screenshotPath, videoPath } = testInfo
        
        let comment = `{color:#FF0000}*Test Failed Again*{color}\n\n`
        comment += `*Timestamp:* ${timestamp}\n`
        comment += `*Environment:* ${environment}\n`
        comment += `*Browser:* ${browser}\n\n`
        comment += `*Error:*\n`
        comment += `{quote}\n`
        comment += `${errorMessage || 'No error message available'}\n`
        comment += `{quote}\n\n`
        
        if (screenshotPath || videoPath) {
            comment += `*Attachments:*\n`
            if (screenshotPath) {
                comment += `** Screenshot: ${screenshotPath}\n`
            }
            if (videoPath) {
                comment += `** Video: ${videoPath}\n`
            }
        }
        
        return comment
    }

    /**
     * Truncate stack trace to avoid Jira description limits
     */
    truncateStackTrace(stackTrace, maxLength = 3000) {
        if (!stackTrace) return ''
        if (stackTrace.length <= maxLength) return stackTrace
        
        return stackTrace.substring(0, maxLength) + '\n... (truncated)'
    }
}

// Export singleton instance
export default new JiraService()