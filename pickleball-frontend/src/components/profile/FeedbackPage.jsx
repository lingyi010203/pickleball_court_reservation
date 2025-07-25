import { useTheme, alpha } from '@mui/material/styles';
import ThemedCard from '../common/ThemedCard';
import { Box, Paper } from '@mui/material';

const FeedbackPage = (props) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 2 }}>
      <ThemedCard
        title="Feedback"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          }}
        >
          <Box sx={{ p: 2 }}>
            <h2>Submit Feedback</h2>
            <form>
              <label>
                Feedback Type:
                <select>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <br />
              <label>
                Description:
                <textarea rows="4" cols="50"></textarea>
              </label>
              <br />
              <button type="submit">Submit Feedback</button>
            </form>
          </Box>
        </Paper>
      </ThemedCard>
    </Box>
  );
};

export default FeedbackPage; 