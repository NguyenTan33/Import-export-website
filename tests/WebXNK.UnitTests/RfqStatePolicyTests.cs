using WebXNK.Application.Common.Policies;
using Xunit;

namespace WebXNK.UnitTests;

public class RfqStatePolicyTests
{
    private readonly RfqStatePolicy _policy = new();

    [Theory]
    [InlineData("SUBMITTED", "QUOTED", true)]
    [InlineData("QUOTED", "ACCEPTED", true)]
    [InlineData("QUOTED", "REVISED", true)]
    [InlineData("REVISED", "QUOTED", true)]
    [InlineData("ACCEPTED", "IN_PRODUCTION", true)]
    [InlineData("IN_PRODUCTION", "SHIPPED", true)]
    [InlineData("SHIPPED", "COMPLETED", true)]
    [InlineData("SUBMITTED", "IN_PRODUCTION", false)]
    [InlineData("ACCEPTED", "QUOTED", false)]
    [InlineData("COMPLETED", "SUBMITTED", false)]
    public void CanTransition_ShouldEnforceStateMachineRules(string current, string target, bool expected)
    {
        var result = _policy.CanTransition(current, target);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void EnsureCanTransition_WhenInvalidTransition_ShouldThrowInvalidOperationException()
    {
        Assert.Throws<InvalidOperationException>(() =>
        {
            _policy.EnsureCanTransition("SUBMITTED", "COMPLETED");
        });
    }

    [Theory]
    [InlineData(10, "LCL")]
    [InlineData(25, "20ft")]
    [InlineData(50, "40ft General Purpose")]
    [InlineData(65, "40ft High Cube")]
    public void SuggestContainerType_ShouldReturnCorrectContainerCategory(decimal cbm, string expectedKeyword)
    {
        var suggestion = _policy.SuggestContainerType(cbm);
        Assert.Contains(expectedKeyword, suggestion);
    }
}
