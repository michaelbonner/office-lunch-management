# API Tokens Documentation

## Overview

API tokens allow you to authenticate with the Office Lunch Management API programmatically. This enables you to check your opt-in status, opt in, and opt out using scripts or automation tools.

## Generating API Tokens

### Via Web Interface

1. Log in to your account
2. Navigate to `/tokens` page
3. Click "Create New Token"
4. Enter a descriptive name (e.g., "Automation Script", "CI/CD Pipeline")
5. Optionally set an expiration date in days
6. Click "Create Token"
7. **Important:** Copy the token immediately - you won't be able to see it again!

### Token Format

Tokens are generated in the format: `olm_<random_string>`

Example: `olm_AbCdEf123456...`

## Using API Tokens

### Authentication

Include the token in the `Authorization` header of your HTTP requests:

```bash
Authorization: Bearer olm_your_token_here
```

Or simply:

```bash
Authorization: olm_your_token_here
```

## Available API Endpoints

### 1. Get Opt-In Status

Check if you're opted in for a specific date.

**Endpoint:** `GET /api/v1/opt-in`

**Query Parameters:**

- `date` (optional): Date in YYYY-MM-DD format. Defaults to today.

**Example Request:**

```bash
curl -X GET "https://your-domain.com/api/v1/opt-in?date=2024-01-15" \
  -H "Authorization: Bearer olm_your_token_here"
```

**Example Response:**

```json
{
	"userId": "user_123",
	"date": "2024-01-15",
	"optedIn": true
}
```

### 2. Opt In or Out

Change your opt-in status for a specific date.

**Endpoint:** `POST /api/v1/opt-in`

**Request Body:**

```json
{
	"action": "in", // or "out"
	"date": "2024-01-15" // optional, defaults to today
}
```

**Example Request - Opt In:**

```bash
curl -X POST "https://your-domain.com/api/v1/opt-in" \
  -H "Authorization: Bearer olm_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"action": "in"}'
```

**Example Response:**

```json
{
	"success": true,
	"message": "Successfully opted in",
	"userId": "user_123",
	"date": "2024-01-15",
	"optedIn": true
}
```

**Example Request - Opt Out:**

```bash
curl -X POST "https://your-domain.com/api/v1/opt-in" \
  -H "Authorization: Bearer olm_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"action": "out"}'
```

**Example Response:**

```json
{
	"success": true,
	"message": "Successfully opted out",
	"userId": "user_123",
	"date": "2024-01-15",
	"optedIn": false
}
```

## Managing Tokens

### List Your Tokens

**Endpoint:** `GET /api/tokens`

**Authentication:** Session or API token

**Example Request:**

```bash
curl -X GET "https://your-domain.com/api/tokens" \
  -H "Authorization: Bearer olm_your_token_here"
```

**Example Response:**

```json
[
	{
		"id": "token_123",
		"name": "My Automation Script",
		"lastUsedAt": "2024-01-15T10:30:00.000Z",
		"expiresAt": null,
		"createdAt": "2024-01-01T00:00:00.000Z"
	}
]
```

### Delete a Token

**Endpoint:** `DELETE /api/tokens/{id}`

**Authentication:** Session or API token

**Example Request:**

```bash
curl -X DELETE "https://your-domain.com/api/tokens/token_123" \
  -H "Authorization: Bearer olm_your_token_here"
```

**Example Response:**

```json
{
	"success": true
}
```

## Error Responses

### 401 Unauthorized

Invalid or expired token.

```json
{
	"message": "Unauthorized: Invalid or expired token"
}
```

### 403 Forbidden

Account is banned.

```json
{
	"message": "Forbidden: Account is permanently banned"
}
```

### 400 Bad Request

Invalid request parameters.

```json
{
	"message": "Invalid date format. Use YYYY-MM-DD"
}
```

## Best Practices

1. **Keep tokens secure:** Never commit tokens to version control or share them publicly
2. **Use descriptive names:** Name tokens based on their purpose (e.g., "GitHub Actions", "Slack Bot")
3. **Set expiration dates:** For enhanced security, set expiration dates on tokens
4. **Rotate tokens regularly:** Delete old tokens and create new ones periodically
5. **Delete unused tokens:** Remove tokens that are no longer needed
6. **Monitor last used:** Check the "Last used" timestamp to identify unused tokens

## Examples

### Bash Script

```bash
#!/bin/bash

TOKEN="olm_your_token_here"
API_URL="https://your-domain.com"

# Check opt-in status
echo "Checking opt-in status..."
curl -X GET "${API_URL}/api/v1/opt-in" \
  -H "Authorization: Bearer ${TOKEN}"

# Opt in for today
echo "Opting in..."
curl -X POST "${API_URL}/api/v1/opt-in" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"action": "in"}'
```

### Python Script

```python
import requests

TOKEN = "olm_your_token_here"
API_URL = "https://your-domain.com"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Check opt-in status
response = requests.get(f"{API_URL}/api/v1/opt-in", headers=headers)
print(response.json())

# Opt in for today
response = requests.post(
    f"{API_URL}/api/v1/opt-in",
    headers=headers,
    json={"action": "in"}
)
print(response.json())
```

### JavaScript/Node.js

```javascript
const TOKEN = 'olm_your_token_here';
const API_URL = 'https://your-domain.com';

const headers = {
	Authorization: `Bearer ${TOKEN}`,
	'Content-Type': 'application/json'
};

// Check opt-in status
async function checkOptInStatus() {
	const response = await fetch(`${API_URL}/api/v1/opt-in`, { headers });
	const data = await response.json();
	console.log(data);
}

// Opt in for today
async function optIn() {
	const response = await fetch(`${API_URL}/api/v1/opt-in`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ action: 'in' })
	});
	const data = await response.json();
	console.log(data);
}

checkOptInStatus();
optIn();
```

## Security Notes

- Tokens are hashed before being stored in the database using SHA-256
- Tokens are only shown once at creation time
- Expired tokens are automatically rejected
- Each token tracks its last usage time
- Tokens can be revoked at any time by deleting them
- Failed authentication attempts do not reveal whether a token exists

## Support

If you encounter any issues or have questions about API tokens, please contact your system administrator or open an issue in the project repository.
