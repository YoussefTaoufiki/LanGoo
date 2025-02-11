import React from 'react';
import { Grid, Box, styled } from '@mui/material';
import BookCard from './BookCard';
import { useBooks } from '../hooks/useBooks';

const GridContainer = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

interface BookGridProps {
  searchQuery: string;
  selectedLevel: string | null;
}

export const BookGrid: React.FC<BookGridProps> = ({
  searchQuery,
  selectedLevel,
}) => {
  const { books, isLoading, error } = useBooks();

  const filteredBooks = books?.filter((book) => {
    const matchesSearch =
      !searchQuery ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = !selectedLevel || book.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  if (isLoading) {
    return (
      <GridContainer container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <BookCard.Skeleton />
          </Grid>
        ))}
      </GridContainer>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        Error loading books. Please try again later.
      </Box>
    );
  }

  if (!filteredBooks?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        No books found matching your criteria.
      </Box>
    );
  }

  return (
    <GridContainer container spacing={3}>
      {filteredBooks.map((book) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
          <BookCard book={book} />
        </Grid>
      ))}
    </GridContainer>
  );
};

export default BookGrid; 