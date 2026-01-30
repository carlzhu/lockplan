# GitHub Workflows

## Docker Build and Push Workflow

This workflow automatically builds and pushes the DoNow backend API Docker image to Docker Hub.

### Setup Instructions

1. **Create Docker Hub Account**
   - Sign up at https://hub.docker.com if you don't have an account

2. **Configure GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:
   
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token (recommended)
   
   To create a Docker Hub access token:
   - Log in to Docker Hub
   - Go to Account Settings → Security → New Access Token
   - Create a token with Read & Write permissions
   - Use this token as `DOCKER_PASSWORD`

3. **Workflow Triggers**
   
   The workflow runs automatically when:
   - Code is pushed to `main`, `master`, or `develop` branches
   - Changes are made to files in the `backend/` directory
   - A pull request is opened targeting `main` or `master`
   - Manually triggered via GitHub Actions UI (workflow_dispatch)

4. **Docker Image Tags**
   
   The workflow creates multiple tags:
   - `latest`: Latest build from the default branch
   - `<branch-name>`: Branch-specific builds
   - `<branch>-<sha>`: Commit-specific builds
   - `<version>`: Semantic version tags (if using git tags)

5. **Using the Docker Image**
   
   Pull and run the image:
   ```bash
   docker pull docker.io/<your-username>/donow-api:latest
   docker run -p 8080:8080 docker.io/<your-username>/donow-api:latest
   ```

### Workflow Features

- ✅ Multi-platform builds (linux/amd64, linux/arm64)
- ✅ Docker layer caching for faster builds
- ✅ Automatic tagging based on branch/commit
- ✅ Only pushes on main branches (not on PRs)
- ✅ Build verification on pull requests

### Customization

To customize the workflow:

1. **Change image name**: Edit `DOCKER_IMAGE_NAME` in the workflow file
2. **Add more branches**: Add to the `branches` list under `on.push`
3. **Change platforms**: Modify the `platforms` parameter in the build step
4. **Add build args**: Add `build-args` to the build-push action

### Troubleshooting

**Build fails with "unauthorized" error:**
- Verify your Docker Hub credentials in GitHub Secrets
- Ensure the access token has Read & Write permissions

**Image not found after push:**
- Check that the workflow completed successfully
- Verify the image name matches your Docker Hub username
- Ensure you're logged in: `docker login docker.io`

**Build is slow:**
- The first build will be slower; subsequent builds use caching
- Check that cache-from/cache-to are properly configured
