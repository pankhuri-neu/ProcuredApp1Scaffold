import { useState } from "react";
import { Button, Code, Input, Text } from "@stellar/design-system";
import { Box } from "../components/layout/Box";

export const GuessTheNumberDemo = () => {
  const [guessedIt, setGuessedIt] = useState<boolean>();
  const [theGuess, setTheGuess] = useState<number>();
  const secretNumber = 7; // Demo secret number

  const submitGuess = async () => {
    if (!theGuess) return;
    // Simulate the contract call
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    setGuessedIt(theGuess === secretNumber);
  };

  return (
    <div style={{ border: '2px dashed #ccc', padding: '20px', borderRadius: '8px' }}>
      <Text as="p" size="sm" style={{ fontStyle: 'italic', color: '#666', marginBottom: '16px' }}>
        📋 Demo Mode - No wallet required. Secret number is {secretNumber} for testing!
      </Text>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitGuess();
        }}
      >
        {guessedIt ? (
          <>
            <Text as="p" size="lg">
              You got it! 🎉
            </Text>
            <Text as="p" size="lg">
              Set a new number by calling <Code size="md">reset</Code> from the
              CLI as the admin.
            </Text>
            <Button
              type="button"
              onClick={() => {
                setGuessedIt(undefined);
                setTheGuess(undefined);
              }}
              variant="secondary"
              size="md"
              style={{ marginTop: '16px' }}
            >
              Try Again
            </Button>
          </>
        ) : (
          <Box gap="sm" direction="row" align="end" justify="end" wrap="wrap">
            <Input
              label="Guess a number from 1 to 10!"
              id="guess"
              fieldSize="lg"
              error={guessedIt === false && "Wrong! Guess again."}
              value={theGuess || ''}
              onChange={(e) => {
                setGuessedIt(undefined);
                setTheGuess(Number(e.target.value));
              }}
            />
            <Button
              type="submit"
              disabled={!theGuess}
              style={{ marginTop: 8 }}
              variant="primary"
              size="md"
            >
              Submit Guess
            </Button>
          </Box>
        )}
        <Text as="p" size="lg">
          &nbsp;
        </Text>
      </form>
    </div>
  );
};
