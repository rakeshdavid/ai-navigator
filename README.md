# AI Navigator - Organization AI Maturity Assessment Tool

## Overview

AI Navigator is a comprehensive web application designed to help organizations assess their AI maturity levels and generate customized roadmaps for AI implementation. Using a framework based on Gartner's AI maturity model, it provides actionable insights and implementation plans to advance your organization's AI capabilities.

## 🚀 Key Features

- **AI Maturity Assessment**: Evaluate your organization's current maturity across key pillars including AI Strategy, AI Value, AI Organization, People & Culture, Governance, Engineering, and Data
- **Gap Analysis**: Visualize the gap between your current and target maturity levels through interactive charts
- **Customized Roadmap Generation**: Generate a detailed implementation roadmap tailored to your specific business goals
- **Timeline Visualization**: View your AI journey across quarters with clear stages, milestones, and key performance indicators
- **Multiple AI Provider Support**: Use your preferred AI provider (Google Gemini, OpenAI, or Anthropic) for roadmap generation

## 🛠️ Tech Stack

- **Frontend**: React with Tailwind CSS for styling
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Charts**: Recharts for data visualization
- **Deployment**: Render and MongoDB Atlas (free tier options)

## 📋 Prerequisites

Before you begin, ensure you have:
- Git installed on your machine
- A GitHub account (optional but recommended)
- A [Render](https://render.com/) account for deployment
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account for database hosting

## 🚀 Deployment Guide

This guide will walk you through deploying your full-stack application using Render's free tier along with MongoDB Atlas.

### Part 1: Setting Up MongoDB Atlas

MongoDB Atlas provides a free tier cloud database that's perfect for small applications.

#### Creating a MongoDB Atlas Account and Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account
2. Click on **Build a Cluster**
3. Select **Free** tier (you'll see "Shared" clusters that include a free tier option)
4. Choose your preferred cloud provider and region (the default options are fine)
5. Click on **Create Deployment**

#### Setting Up Database Access

After your cluster is created, set up a database user:

1. In the MongoDB Atlas dashboard, click on **Database Access** under the Security section
2. Click on **Add New Database User**
3. Enter a username (e.g., "appuser") and click on **Autogenerate Secure Password**
4. Click on **Copy** to save this password somewhere secure - you'll need it later!
5. Under "Database User Privileges", select **Read and write to any database**
6. Click on **Add User**

#### Configuring Network Access

By default, MongoDB Atlas restricts which IP addresses can connect to your database. For this application, we'll whitelist all IP addresses:

1. In the MongoDB Atlas dashboard, click on **Network Access** under the Security section
2. Click on **Edit** (or **Add IP Address** if there's no entry yet)
3. Click on **ALLOW ACCESS FROM ANYWHERE**
4. Click on **Confirm**

#### Getting Your Connection String

1. Go back to the **Clusters** view in MongoDB Atlas
2. Click on **Connect** for your cluster
3. Select **Drivers** as the connection method
4. Copy the connection string (it should look like `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
5. Replace `<password>` with the password you saved earlier

### Part 2: Deploying on Render

Render provides an easy way to deploy both your frontend and backend applications.

#### Setting Up Your Render Account

1. Go to [Render](https://render.com/) and sign up for a free account
2. Connect your GitHub account if your code is hosted there, or prepare to upload your code directly

#### Creating a Blueprint for Deployment

Render uses a YAML file to define your services. Create a file named `render.yaml` in the root of your project with the following content:

```yaml
services:
  # Backend API service
  - type: web
    name: ai-navigator-api
    runtime: python
    region: oregon
    plan: free
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT --workers 1 --reload
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: MONGO_URL
        sync: false
      - key: SECRET_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://ai-navigator-frontend.onrender.com

  # Frontend React application
  - type: web
    name: ai-navigator-frontend
    runtime: node
    region: oregon
    plan: free
    buildCommand: cd frontend && npm i
    startCommand: cd frontend && PORT=$PORT npm start
    envVars:
      - key: NODE_VERSION
        value: 16.20.0
      - key: REACT_APP_BACKEND_URL
        fromService:
          name: ai-navigator-api
          type: web
          envVarKey: RENDER_EXTERNAL_URL
```

#### Deploying Your Application on Render

1. Go to the Render dashboard
2. Click on **New** and select **Blueprint**
3. Connect your repository (if using GitHub) or upload your code
4. Render will detect the `render.yaml` file and suggest creating the services defined in it
5. Click on **Apply**

#### Setting Up Environment Variables

After the initial deployment, you need to set up your environment variables:

1. In the Render dashboard, click on your backend service
2. Go to the **Environment** tab
3. Add the following environment variables:
   - `MONGO_URL`: The MongoDB connection string you saved earlier
   - `SECRET_KEY`: A random string for encryption (you can generate one using an online tool)
4. Click on **Save Changes**

### Part 3: Connecting Everything

After deployment, Render will provide URLs for both your frontend and backend services. Make sure they can communicate with each other:

1. In the Render dashboard, go to your frontend service
2. Note the URL (it should be something like `https://ai-navigator-frontend.onrender.com`)
3. Go to your backend service
4. In the Environment tab, make sure `FRONTEND_URL` is set to your frontend URL
5. Similarly, your frontend needs to know the backend URL, which should be automatically set via the `REACT_APP_BACKEND_URL` environment variable in the render.yaml

## 🎯 Usage

Once deployed, users can:

1. Access the application through the frontend URL provided by Render
2. Input their organization's business goals
3. Select current and target maturity levels across key AI pillars
4. Generate a customized AI implementation roadmap
5. View and export the roadmap with detailed timelines, milestones, and KPIs

**Note**: For first-time users, a free query is available without an API key. Subsequent uses require providing your own API key from Google Gemini, OpenAI, or Anthropic.

## 🔧 Troubleshooting

### Database Connection Problems

If your application cannot connect to MongoDB:
- Double-check that you've whitelisted all IP addresses in MongoDB Atlas
- Verify the connection string is correct and properly formatted
- Make sure you've replaced `<password>` with your actual password
- Check that the username and password don't contain any special characters that need URL encoding

### Render Deployment Issues

If your application fails to deploy on Render:
- Check the build logs for errors
- Make sure all dependencies are correctly specified in your requirements.txt or package.json
- Verify your start command is correct

### CORS Errors

If you see CORS errors in your browser console:
- Make sure your backend is correctly configured to accept requests from your frontend URL
- Check that your frontend is using the correct backend URL

## 🔄 Maintenance and Updates

To update your application:

1. Push changes to your GitHub repository (if connected)
2. Render will automatically detect changes and redeploy
3. You can also manually trigger a deployment from the Render dashboard

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs)

## ⚠️ Important Notes

- This application is intended for educational and planning purposes
- Implementation of the generated roadmaps should be guided by AI and organizational transformation experts
- The free tier of Render may have limitations on uptime and resources
- Consider upgrading to paid tiers for production use

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

[Add your license here]

---

**Happy coding!** 🎉

If you need further assistance, don't hesitate to open an issue or reach out to the community.
