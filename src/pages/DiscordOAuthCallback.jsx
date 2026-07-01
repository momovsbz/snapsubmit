import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function DiscordOAuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (!code) {
          setError('Code d\'autorisation manquant');
          setLoading(false);
          return;
        }

        // Call backend to exchange code for Discord ID
        const response = await base44.functions.invoke('discordOAuthCallback', {
          code,
          state
        });

        const { discordId, discordUsername, submissionId, action } = response.data;

        // Store Discord ID and trigger action
        if (submissionId && action) {
          // Log the Discord user who performed the action
          await base44.functions.invoke('logAction', {
            submissionId,
            action,
            discordId,
            discordUsername
          }).catch(err => console.error('Log error:', err));

          // Trigger the action (valid, wrong, wait, etc.)
          await base44.functions.invoke('sendCode', {
            submissionId,
            action
          }).catch(err => console.error('Action error:', err));

          // Redirect to home with success
          navigate('/?status=success&submissionId=' + submissionId);
        } else {
          navigate('/?discordId=' + discordId);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Erreur lors de l\'authentification');
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="w-full max-w-md text-center">
        {loading ? (
          <>
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-foreground">Authentification Discord en cours...</p>
          </>
        ) : error ? (
          <div className="bg-card border border-destructive/30 rounded-lg px-6 py-4">
            <p className="text-destructive">{error}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}