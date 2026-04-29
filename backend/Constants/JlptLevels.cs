namespace Constants;

public static class JlptLevels
{
    public const string N5 = "N5";
    public const string N4 = "N4";
    public const string N3 = "N3";

    public static readonly string[] SeedOrder = [N5, N4, N3];

    public static string Normalize(string? levelName)
    {
        return levelName?.Trim().ToUpperInvariant() switch
        {
            N5 => N5,
            N4 => N4,
            N3 => N3,
            _ => string.Empty,
        };
    }
}
