namespace WebXNK.Application.Common.Incoterms;

public interface IIncotermStrategyFactory
{
    IIncotermPriceStrategy GetStrategy(string incotermCode);
}

public class IncotermStrategyFactory : IIncotermStrategyFactory
{
    private readonly IEnumerable<IIncotermPriceStrategy> _strategies;
    private readonly IIncotermPriceStrategy _defaultStrategy;

    public IncotermStrategyFactory(IEnumerable<IIncotermPriceStrategy> strategies)
    {
        _strategies = strategies;
        _defaultStrategy = strategies.FirstOrDefault(s => s.IncotermCode == "FOB") ?? new FobIncotermStrategy();
    }

    public IIncotermPriceStrategy GetStrategy(string incotermCode)
    {
        if (string.IsNullOrWhiteSpace(incotermCode))
        {
            return _defaultStrategy;
        }

        var normalizedCode = incotermCode.Trim().ToUpperInvariant();
        return _strategies.FirstOrDefault(s => s.IncotermCode == normalizedCode) ?? _defaultStrategy;
    }
}
