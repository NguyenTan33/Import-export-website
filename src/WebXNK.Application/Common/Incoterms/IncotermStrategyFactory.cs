namespace WebXNK.Application.Common.Incoterms;

public interface IIncotermStrategyFactory
{
    IIncotermPriceStrategy GetStrategy(string incotermCode);
}

public class IncotermStrategyFactory : IIncotermStrategyFactory
{
    private readonly Dictionary<string, IIncotermPriceStrategy> _strategies;
    private readonly IIncotermPriceStrategy _defaultStrategy;

    public IncotermStrategyFactory(IEnumerable<IIncotermPriceStrategy> strategies)
    {
        _strategies = new Dictionary<string, IIncotermPriceStrategy>(StringComparer.OrdinalIgnoreCase);
        foreach (var strategy in strategies)
        {
            _strategies[strategy.IncotermCode] = strategy;
        }
        _defaultStrategy = _strategies.TryGetValue("FOB", out var defaultStrategy)
            ? defaultStrategy
            : (_strategies.Values.FirstOrDefault() ?? new FobIncotermStrategy());
    }

    public IIncotermPriceStrategy GetStrategy(string incotermCode)
    {
        if (string.IsNullOrWhiteSpace(incotermCode))
        {
            return _defaultStrategy;
        }

        var normalizedCode = incotermCode.Trim();
        return _strategies.TryGetValue(normalizedCode, out var strategy) ? strategy : _defaultStrategy;
    }
}
