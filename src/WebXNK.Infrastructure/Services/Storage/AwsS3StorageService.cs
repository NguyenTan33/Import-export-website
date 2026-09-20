using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebXNK.Application.Common.Interfaces;

namespace WebXNK.Infrastructure.Services.Storage;

public class AwsS3StorageService : IStorageService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AwsS3StorageService> _logger;
    private readonly string? _bucketName;
    private readonly string? _region;
    private readonly IAmazonS3? _s3Client;
    private readonly bool _useAwsS3;
    private readonly string _localStoragePath;

    public AwsS3StorageService(IConfiguration configuration, ILogger<AwsS3StorageService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        _bucketName = configuration["AwsS3:BucketName"];
        _region = configuration["AwsS3:Region"] ?? "ap-southeast-1";
        var accessKey = configuration["AwsS3:AccessKey"];
        var secretKey = configuration["AwsS3:SecretKey"];

        _localStoragePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "storage", "documents");
        if (!Directory.Exists(_localStoragePath))
        {
            Directory.CreateDirectory(_localStoragePath);
        }

        // Kiểm tra xem đã cấu hình AWS S3 thực tế chưa
        if (!string.IsNullOrWhiteSpace(_bucketName) && 
            !string.IsNullOrWhiteSpace(accessKey) && 
            !string.IsNullOrWhiteSpace(secretKey) &&
            !accessKey.Contains("YOUR_AWS_ACCESS_KEY"))
        {
            var regionEndpoint = RegionEndpoint.GetBySystemName(_region);
            _s3Client = new AmazonS3Client(accessKey, secretKey, regionEndpoint);
            _useAwsS3 = true;
            _logger.LogInformation("Đã kích hoạt AWS S3 Storage trên Bucket: {Bucket} (Region: {Region})", _bucketName, _region);
        }
        else
        {
            _useAwsS3 = false;
            _logger.LogWarning("Chưa cấu hình AWS S3 thông tin đầy đủ. Chuyển sang chế độ Local Storage Fallback tại: {Path}", _localStoragePath);
        }
    }

    public async Task<string> UploadFileAsync(
        Stream fileStream, 
        string fileName, 
        string contentType, 
        string folder = "documents", 
        CancellationToken cancellationToken = default)
    {
        var sanitizedFileName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var key = $"{folder.Trim('/')}/{sanitizedFileName}";

        if (_useAwsS3 && _s3Client != null)
        {
            try
            {
                var putRequest = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = fileStream,
                    ContentType = contentType,
                    AutoCloseStream = false
                };

                await _s3Client.PutObjectAsync(putRequest, cancellationToken);
                var s3Url = $"https://{_bucketName}.s3.{_region}.amazonaws.com/{key}";
                _logger.LogInformation("Upload thành công lên AWS S3: {Url}", s3Url);
                return s3Url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi upload lên AWS S3. Tự động chuyển lưu cục bộ (Local Fallback).");
            }
        }

        // Local Storage Fallback
        var targetFolder = Path.Combine(_localStoragePath, folder);
        if (!Directory.Exists(targetFolder))
        {
            Directory.CreateDirectory(targetFolder);
        }

        var localFilePath = Path.Combine(targetFolder, sanitizedFileName);
        fileStream.Position = 0;
        using (var outputStream = File.Create(localFilePath))
        {
            await fileStream.CopyToAsync(outputStream, cancellationToken);
        }

        var localUrl = $"/api/v1/documents/files/{folder}/{sanitizedFileName}";
        _logger.LogInformation("Đã lưu file thành công vào Local Storage: {Path}", localFilePath);
        return localUrl;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> GetFileStreamAsync(
        string fileUrlOrKey, 
        CancellationToken cancellationToken = default)
    {
        if (_useAwsS3 && _s3Client != null && fileUrlOrKey.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(fileUrlOrKey);
                var key = uri.AbsolutePath.TrimStart('/');

                var getRequest = new GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key
                };

                var response = await _s3Client.GetObjectAsync(getRequest, cancellationToken);
                var memoryStream = new MemoryStream();
                await response.ResponseStream.CopyToAsync(memoryStream, cancellationToken);
                memoryStream.Position = 0;

                var fileName = Path.GetFileName(key);
                return (memoryStream, response.Headers.ContentType ?? "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tải file từ AWS S3: {Key}", fileUrlOrKey);
            }
        }

        // Local Storage Lookup
        var cleanKey = fileUrlOrKey.Replace("/api/v1/documents/files/", "").Replace('/', Path.DirectorySeparatorChar);
        var localPath = Path.Combine(_localStoragePath, cleanKey);

        if (!File.Exists(localPath))
        {
            // Thử tìm trong toàn bộ thư mục local
            var fileNameOnly = Path.GetFileName(fileUrlOrKey);
            var matchedFiles = Directory.GetFiles(_localStoragePath, fileNameOnly, SearchOption.AllDirectories);
            if (matchedFiles.Length > 0)
            {
                localPath = matchedFiles[0];
            }
            else
            {
                throw new FileNotFoundException($"Không tìm thấy file lưu trữ tại đường dẫn: {fileUrlOrKey}");
            }
        }

        var bytes = await File.ReadAllBytesAsync(localPath, cancellationToken);
        var stream = new MemoryStream(bytes);
        return (stream, "application/pdf", Path.GetFileName(localPath));
    }

    public Task<string> GetPresignedUrlAsync(
        string fileUrlOrKey, 
        TimeSpan expiry, 
        CancellationToken cancellationToken = default)
    {
        if (_useAwsS3 && _s3Client != null && fileUrlOrKey.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(fileUrlOrKey);
                var key = uri.AbsolutePath.TrimStart('/');

                var presignedRequest = new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    Expires = DateTime.UtcNow.Add(expiry),
                    Verb = HttpVerb.GET
                };

                var url = _s3Client.GetPreSignedURL(presignedRequest);
                return Task.FromResult(url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi sinh Presigned URL từ AWS S3 cho key {Key}", fileUrlOrKey);
            }
        }

        // Trả về chính URL cục bộ
        return Task.FromResult(fileUrlOrKey);
    }
}
