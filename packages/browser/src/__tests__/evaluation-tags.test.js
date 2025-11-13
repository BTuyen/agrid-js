import { PostHogFeatureFlags } from '../posthog-featureflags';
describe('Evaluation Tags/Environments', () => {
    let posthog;
    let featureFlags;
    let mockSendRequest;
    beforeEach(() => {
        // Create a mock PostHog instance
        posthog = {
            config: {},
            persistence: {
                get_distinct_id: jest.fn().mockReturnValue('test-distinct-id'),
                get_initial_props: jest.fn().mockReturnValue({}),
            },
            get_property: jest.fn().mockReturnValue({}),
            get_distinct_id: jest.fn().mockReturnValue('test-distinct-id'),
            getGroups: jest.fn().mockReturnValue({}),
            requestRouter: {
                endpointFor: jest.fn().mockReturnValue('/flags/?v=2&config=true'),
            },
            _send_request: jest.fn(),
            _shouldDisableFlags: jest.fn().mockReturnValue(false),
        };
        mockSendRequest = posthog._send_request;
        featureFlags = new PostHogFeatureFlags(posthog);
    });
    describe('_getValidEvaluationEnvironments', () => {
        it('should return empty array when no environments configured', () => {
            posthog.config.evaluation_environments = undefined;
            const result = featureFlags._getValidEvaluationEnvironments();
            expect(result).toEqual([]);
        });
        it('should return empty array when environments is empty', () => {
            posthog.config.evaluation_environments = [];
            const result = featureFlags._getValidEvaluationEnvironments();
            expect(result).toEqual([]);
        });
        it('should filter out invalid environments', () => {
            posthog.config.evaluation_environments = [
                'production',
                '',
                'staging',
                null,
                'development',
                undefined,
                '   ', // whitespace only
            ];
            const result = featureFlags._getValidEvaluationEnvironments();
            expect(result).toEqual(['production', 'staging', 'development']);
        });
        it('should handle readonly array of valid environments', () => {
            const environments = ['production', 'staging', 'development'];
            posthog.config.evaluation_environments = environments;
            const result = featureFlags._getValidEvaluationEnvironments();
            expect(result).toEqual(['production', 'staging', 'development']);
        });
    });
    describe('_shouldIncludeEvaluationEnvironments', () => {
        it('should return false when no valid environments', () => {
            posthog.config.evaluation_environments = ['', '   '];
            const result = featureFlags._shouldIncludeEvaluationEnvironments();
            expect(result).toBe(false);
        });
        it('should return true when valid environments exist', () => {
            posthog.config.evaluation_environments = ['production'];
            const result = featureFlags._shouldIncludeEvaluationEnvironments();
            expect(result).toBe(true);
        });
    });
    describe('_callFlagsEndpoint', () => {
        it('should include evaluation_environments in request when configured', () => {
            posthog.config.evaluation_environments = ['production', 'experiment-A'];
            featureFlags._callFlagsEndpoint();
            expect(mockSendRequest).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    evaluation_environments: ['production', 'experiment-A'],
                }),
            }));
        });
        it('should not include evaluation_environments when not configured', () => {
            posthog.config.evaluation_environments = undefined;
            featureFlags._callFlagsEndpoint();
            expect(mockSendRequest).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.not.objectContaining({
                    evaluation_environments: expect.anything(),
                }),
            }));
        });
        it('should not include evaluation_environments when empty array', () => {
            posthog.config.evaluation_environments = [];
            featureFlags._callFlagsEndpoint();
            expect(mockSendRequest).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.not.objectContaining({
                    evaluation_environments: expect.anything(),
                }),
            }));
        });
        it('should filter out invalid environments before sending', () => {
            posthog.config.evaluation_environments = ['production', '', null, 'staging'];
            featureFlags._callFlagsEndpoint();
            expect(mockSendRequest).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    evaluation_environments: ['production', 'staging'],
                }),
            }));
        });
    });
});
