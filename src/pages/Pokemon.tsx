import React, { useState } from 'react';
import { Layout, Container } from '@/components/Layout';
import { PokemonCompanions } from '@/components/PokemonCompanions';
import { PokemonSelector } from '@/components/PokemonSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePokemon } from '@/hooks/usePokemon';
import { useAuth } from '@/hooks/useAuth';
import { PokemonService } from '@/services/pokemonService';

const pokemonService = PokemonService.getInstance();

export default function Pokemon() {
  const { userPokemon, saveUserPokemon } = usePokemon();
  const [selectedCompanion, setSelectedCompanion] = useState<number | null>(null);
  const [isEditingSelection, setIsEditingSelection] = useState(false);

  // Check if user has already selected their 3 Pokemon companions
  const hasSelectedCompanions = userPokemon.length >= 3;

  const handleEditSelection = () => {
    setIsEditingSelection(true);
    setSelectedCompanion(null);
  };

  const handleSaveEditedSelection = async (selectedPokemon: string[]) => {
    try {
      // Create all new UserPokemon objects
      const newUserPokemon = selectedPokemon.map(pokemonId =>
        pokemonService.createUserPokemon(pokemonId)
      );

      // Replace all existing Pokemon with the new selection
      await saveUserPokemon(newUserPokemon);

      setIsEditingSelection(false);
    } catch (error) {
      console.error('Failed to save edited selection:', error);
    }
  };

  const handleResetPokemon = async () => {
    if (confirm('Are you sure you want to reset all your Pokemon? This will clear all your companions.')) {
      await saveUserPokemon([]);
      setSelectedCompanion(null);
      setIsEditingSelection(false);
    }
  };

  return (
    <Layout background="gradient">
      <Container className="py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pokemon Wellness Companions 🏆
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Build your team of Pokemon companions that grow stronger with your mental health journey.
            Unlock new companions by completing wellness activities!
          </p>
        </div>

        {/* Main Content */}
        {!hasSelectedCompanions && !isEditingSelection ? (
          <PokemonSelector
            onSelectionComplete={() => setIsEditingSelection(false)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isEditingSelection ? "Edit Your Pokemon Team" : "Your Pokemon Team"}</span>
                <div className="flex gap-2">
                  {hasSelectedCompanions && !isEditingSelection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditSelection}
                    >
                      Edit Selection
                    </Button>
                  )}
                  {userPokemon.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleResetPokemon}
                    >
                      Reset All
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditingSelection ? (
                <PokemonSelector
                  onSelectionComplete={handleSaveEditedSelection}
                />
              ) : (
                <PokemonCompanions
                  onSelectCompanion={(slot) => setSelectedCompanion(slot)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Companion Details Modal/Section */}
        {selectedCompanion && selectedCompanion > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Companion {selectedCompanion} Details
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompanion(null)}
                >
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mb-4 flex justify-center">
                  {(() => {
                    const companion = userPokemon[selectedCompanion - 1];
                    if (companion) {
                      const pokemonData = pokemonService.getPokemonById(companion.pokemonId);
                      return pokemonData ? (
                        <img
                          src={pokemonData.image}
                          alt={pokemonData.name}
                          className="w-24 h-24 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null;
                    }
                    return null;
                  })()}
                  <div className="text-6xl hidden">
                    {(() => {
                      const companion = userPokemon[selectedCompanion - 1];
                      if (companion) {
                        const pokemonData = pokemonService.getPokemonById(companion.pokemonId);
                        return pokemonData?.emoji || '🎮';
                      }
                      return '🎮';
                    })()}
                  </div>
                </div>
                {(() => {
                  const companion = userPokemon[selectedCompanion - 1];
                  const pokemonData = companion ? pokemonService.getPokemonById(companion.pokemonId) : null;

                  return (
                    <>
                      <h3 className="text-xl font-semibold mb-2">
                        {pokemonData?.name || 'Unknown Pokemon'}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Level:</strong> {companion?.level || 1}</p>
                        <p><strong>Experience:</strong> {companion?.experience || 0} XP</p>
                        <p><strong>Mood:</strong> {companion?.mood || 'neutral'}</p>
                        <p><strong>Type:</strong> {pokemonData?.type || 'Unknown'}</p>
                        {pokemonData?.secondaryType && (
                          <p><strong>Secondary Type:</strong> {pokemonData.secondaryType}</p>
                        )}
                      </div>
                      <p className="text-gray-600 mt-4">
                        {pokemonData?.description || 'No description available.'}
                      </p>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </Container>
    </Layout>
  );
}