import { useEffect, useState } from 'react';
import { getDefaultBanner, getPublicProfile, resolveMediaUrl } from '../api';

const getFallbackAvatar = (name) => {
  const safeName = encodeURIComponent(name || 'User');
  return `https://ui-avatars.com/api/?name=${safeName}&background=6f33df&color=fff`;
};

function PublicProfileModal({ profileRequest, onClose, showToast }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const modalEl = document.getElementById('publicProfileModal');
    if (!modalEl || !window.bootstrap) return undefined;

    const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    const handleHidden = () => onClose?.();

    modalEl.addEventListener('hidden.bs.modal', handleHidden);

    if (profileRequest?.userId) {
      modalInstance.show();
    } else {
      modalInstance.hide();
    }

    return () => {
      modalEl.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, [profileRequest, onClose]);

  useEffect(() => {
    if (!profileRequest?.userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getPublicProfile(profileRequest.userId);
        if (!cancelled) setProfile(data || null);
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          showToast?.(err.message || 'Profile details unavailable', 'danger');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [profileRequest, showToast]);

  const displayName = profile?.full_name || profile?.username || 'User';
  const avatarFallback = getFallbackAvatar(profile?.username || profileRequest?.username || 'User');
  const bannerFallback = getDefaultBanner(profile?.username || profileRequest?.username || 'Mates');

  return (
    <div className="modal fade" id="publicProfileModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content rounded-4 public-profile-modal">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title">Profile Preview</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body pt-3">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border" /></div>
            ) : (
              <div className="public-profile-shell">
                <img
                  src={resolveMediaUrl(profile?.profile_banner, bannerFallback)}
                  alt="profile banner"
                  className="public-profile-banner"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = bannerFallback;
                  }}
                />
                <div className="public-profile-content">
                  <img
                    src={resolveMediaUrl(profile?.profileImage, avatarFallback)}
                    alt={displayName}
                    className="public-profile-avatar"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = avatarFallback;
                    }}
                  />
                  <div className="public-profile-text">
                    <h2 className="mb-1">{displayName}</h2>
                    <div className="text-secondary mb-3">@{profile?.username || profileRequest?.username || 'user'}</div>
                    <p className="mb-0 text-secondary public-profile-bio">
                      {profile?.bio || 'No bio provided yet.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfileModal;
