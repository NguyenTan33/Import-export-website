# 1. Base Runtime Image (Kèm font và thư viện hỗ trợ QuestPDF rendering)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Cài đặt fontconfig và các font chữ chuẩn UTF-8/tiếng Việt cho QuestPDF render tài liệu xuất nhập khẩu
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    libfreetype6 \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# 2. SDK Build Image
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy toàn bộ file .csproj để restore cache tầng dependencies trước
COPY ["src/WebXNK.Domain/WebXNK.Domain.csproj", "WebXNK.Domain/"]
COPY ["src/WebXNK.Application/WebXNK.Application.csproj", "WebXNK.Application/"]
COPY ["src/WebXNK.Infrastructure/WebXNK.Infrastructure.csproj", "WebXNK.Infrastructure/"]
COPY ["src/WebXNK.Api/WebXNK.Api.csproj", "WebXNK.Api/"]

RUN dotnet restore "WebXNK.Api/WebXNK.Api.csproj"

# Copy toàn bộ mã nguồn và biên dịch
COPY src/ .
WORKDIR "/src/WebXNK.Api"
RUN dotnet build "WebXNK.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 3. Publish Stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "WebXNK.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final Runtime Image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Khởi tạo thư mục tạm để lưu file PDF fallback nếu chạy offline
RUN mkdir -p /app/storage/documents

ENTRYPOINT ["dotnet", "WebXNK.Api.dll"]
