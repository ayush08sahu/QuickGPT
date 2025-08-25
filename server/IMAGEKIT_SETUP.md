# ImageKit Setup Guide

## Fix for 403 Error in Image Generation

The 403 error occurs when ImageKit is not properly configured. Follow these steps to fix it:

### 1. Get ImageKit Credentials

1. Go to [ImageKit Dashboard](https://imagekit.io/dashboard)
2. Sign up or log in to your account
3. Go to "Developer Options" in the left sidebar
4. Copy your:
   - Public Key
   - Private Key
   - URL Endpoint

### 2. Configure Environment Variables

Create a `.env` file in the server directory with these variables:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint_here
```

### 3. Enable AI Image Generation

1. In your ImageKit dashboard, go to "AI Tools"
2. Enable "AI Image Generation" feature
3. Make sure you have sufficient credits for AI generation

### 4. Restart Server

After adding the environment variables, restart your server:

```bash
npm start
```

### 5. Test Image Generation

Try generating an image again. The 403 error should be resolved.

## Troubleshooting

- **403 Error**: Check if ImageKit credentials are correct and AI generation is enabled
- **Missing Environment Variables**: Ensure all three ImageKit variables are set
- **API Limits**: Check your ImageKit usage limits and credits

## Alternative Solution

If you continue to have issues with ImageKit, consider:
1. Using a different image generation service (OpenAI DALL-E, Stable Diffusion, etc.)
2. Contacting ImageKit support for account-specific issues
