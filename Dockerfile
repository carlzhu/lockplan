# 你的当前Dockerfile基本正确，但可以考虑以下优化
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY target/lock-plan-0.0.1-SNAPSHOT.jar app.jar

# 设置JVM参数，确保绑定到所有网络接口
ENTRYPOINT ["java", "-Dserver.address=0.0.0.0", "-jar", "app.jar"]
