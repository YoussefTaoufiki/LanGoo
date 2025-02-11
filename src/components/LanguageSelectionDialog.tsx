import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Language options with their flags (using emoji flags for now, can be replaced with proper flag images)
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

const PROFICIENCY_LEVELS = [
  { value: 'A1', label: 'A1 - Beginner' },
  { value: 'A2', label: 'A2 - Elementary' },
  { value: 'B1', label: 'B1 - Intermediate' },
  { value: 'B2', label: 'B2 - Upper Intermediate' },
  { value: 'C1', label: 'C1 - Advanced' },
  { value: 'C2', label: 'C2 - Mastery' },
];

const LanguageCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

interface LanguageSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onLanguageSelect: (language: string, proficiency: string) => void;
}

export const LanguageSelectionDialog: React.FC<LanguageSelectionDialogProps> = ({
  open,
  onClose,
  onLanguageSelect,
}) => {
  const theme = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState<string>('');

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleSubmit = () => {
    if (selectedLanguage && proficiencyLevel) {
      onLanguageSelect(selectedLanguage, proficiencyLevel);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 2,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h4" align="center" gutterBottom>
          Choose Your Learning Language
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          Select a language and your current proficiency level to get started
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            {LANGUAGES.map((language) => (
              <Grid item xs={6} sm={4} md={3} key={language.code}>
                <LanguageCard
                  elevation={selectedLanguage === language.code ? 4 : 1}
                  onClick={() => handleLanguageSelect(language.code)}
                  sx={{
                    border: selectedLanguage === language.code ? `2px solid ${theme.palette.primary.main}` : 'none',
                  }}
                >
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    {language.flag}
                  </Typography>
                  <Typography variant="subtitle1">{language.name}</Typography>
                </LanguageCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {selectedLanguage && (
          <Box sx={{ mb: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Proficiency Level</InputLabel>
              <Select
                value={proficiencyLevel}
                label="Proficiency Level"
                onChange={(e) => setProficiencyLevel(e.target.value)}
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!selectedLanguage || !proficiencyLevel}
          >
            Start Learning
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelectionDialog;
 