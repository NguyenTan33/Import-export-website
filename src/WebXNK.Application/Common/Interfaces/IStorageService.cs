namespace WebXNK.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadFileAsync(
        Stream fileStream, 
        string fileName, 
        string contentType, 
        string folder = "documents", 
        CancellationToken cancellationToken = default);

    Task<(Stream Stream, string ContentType, string FileName)> GetFileStreamAsync(
        string fileUrlOrKey, 
        CancellationToken cancellationToken = default);

    Task<string> GetPresignedUrlAsync(
        string fileUrlOrKey, 
        TimeSpan expiry, 
        CancellationToken cancellationToken = default);
}
