# GitHub Workflows

## Docker Build and Push Workflow

This workflow automatically builds and pushes the DoNow backend API Docker image to Docker Hub.

### Setup Instructions

#### 方案 1: 项目级别 Secrets（简单但需要每个项目设置）

1. **Create Docker Hub Account**
   - Sign up at https://hub.docker.com if you don't have an account

2. **Configure GitHub Secrets**
   
   Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:
   
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token (recommended)

#### 方案 2: 使用 Environment（推荐，便于管理）

1. **创建 Environment**
   - 进入仓库 → Settings → Environments
   - 点击 "New environment"
   - 名称设为 `docker-hub`

2. **在 Environment 中添加 Secrets**
   - 在 `docker-hub` 环境中添加：
     - `DOCKER_USERNAME`: Your Docker Hub username
     - `DOCKER_PASSWORD`: Your Docker Hub password or access token

3. **优势**
   - 集中管理相关的 secrets
   - 可以添加保护规则（需要审批等）
   - 更清晰的组织结构

#### 方案 3: 组织级别 Secrets（适合团队）

如果你的仓库在 GitHub 组织下：

1. **进入组织设置**
   - 访问 `https://github.com/organizations/<your-org>/settings/secrets/actions`

2. **添加组织级别的 secrets**
   - 点击 "New organization secret"
   - 添加 `DOCKER_USERNAME` 和 `DOCKER_PASSWORD`
   - 选择可以访问的仓库（所有或指定）

3. **优势**
   - 只需设置一次
   - 组织内所有仓库都可以使用
   - 统一管理

#### 方案 4: 可重用 Workflow（最佳实践，适合多项目）

创建一个中央仓库存放可重用的 workflow：

1. **创建中央仓库**（如 `github-workflows`）
2. **在中央仓库添加可重用 workflow**（参考 `reusable-docker-build.yml`）
3. **在项目中调用**（取消注释 workflow 文件中的 `uses` 部分）
4. **只需在中央仓库设置一次 secrets**

### Docker Hub Access Token（推荐）
   
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
