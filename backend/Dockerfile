# ==========================================
# STAGE 1: MÔI TRƯỜNG BUILD & DEVELOPMENT 
# Chứa đầy đủ .NET SDK để code, compile và chạy Hot Reload (dotnet watch)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy file .csproj và restore trước (Giúp tận dụng cache của Docker, tăng tốc build)
COPY ["backend.csproj", "./"]
RUN dotnet restore "backend.csproj"

# Copy toàn bộ mã nguồn vào container
COPY . .

# ==========================================
# STAGE 2: PUBLISH (Dùng khi đóng gói Production)
# ==========================================
FROM build AS publish
RUN dotnet publish "backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# STAGE 3: MÔI TRƯỜNG RUNTIME (PRODUCTION MỚI DÙNG)
# Môi trường siêu nhẹ, không chứa SDK, chỉ chứa Runtime để chạy web
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Mở cổng 5135
EXPOSE 5135
ENV ASPNETCORE_URLS=http://+:5135

# Copy file đã build từ STAGE 2 sang
COPY --from=publish /app/publish .

# Lệnh chạy mặc định cho môi trường Production
ENTRYPOINT ["dotnet", "backend.dll"]