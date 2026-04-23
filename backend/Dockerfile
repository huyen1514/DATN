# Sử dụng SDK để build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy file .csproj và restore các packages
COPY ["backend.csproj", "./"]
RUN dotnet restore "backend.csproj"

# Copy toàn bộ mã nguồn và build
COPY . .
RUN dotnet publish "backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Sử dụng ASP.NET runtime image nhỏ gọn để chạy
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Mở cổng 5135 (tuỳ chọn)
EXPOSE 5135
ENV ASPNETCORE_URLS=http://+:5135

ENTRYPOINT ["dotnet", "backend.dll"]
