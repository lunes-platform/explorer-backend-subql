import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { 
  ArrowLeft, 
  Coins, 
  Hexagon, 
  Database,
  Globe,
  FileText,
  Github,
  Twitter,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { GET_ASSET_DETAIL, GET_PROJECT } from '../../services/graphql/queries';
import Card from '../../components/common/Card';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import DegradedBanner from '../../components/common/DegradedBanner';
import { WatchlistButton } from '../../components/common/WatchlistButton';
import { useHealthStatus } from '../../hooks/useHealthStatus';
import { useWatchlist } from '../../hooks/useWatchlist';
import { getIndexerDegradedLevel, degradedToHealth } from '../../utils/indexerHealth';
import type { GetAssetDetailResponse, GetProjectResponse } from '../../types';
import styles from './AssetDetail.module.css';

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const health = useHealthStatus();
  const { isWatched, toggleItem } = useWatchlist();
  
  const { data: assetData, loading: assetLoading, error: assetError } = 
    useQuery<GetAssetDetailResponse>(GET_ASSET_DETAIL, {
      variables: { id },
      skip: !id
    });

  const { data: projectData } = 
    useQuery<GetProjectResponse>(GET_PROJECT, {
      variables: { id },
      skip: !id
    });

  const loading = assetLoading;
  const error = assetError;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Skeleton height={24} width="200px" />
        </div>
        <Card title="Loading...">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={20} width="80%" />
            <Skeleton height={20} width="50%" />
            <Skeleton height={20} width="70%" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <EmptyState
          type="error"
          message={error.message}
          action={{ label: 'Try Again', onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  const asset = assetData?.asset;
  const project = projectData?.project;
  
  if (!asset) {
    return (
      <div className={styles.container}>
        <EmptyState
          type="no-data"
          message="Asset not found"
          action={{ label: 'View All Assets', onClick: () => window.location.href = '/assets' }}
        />
      </div>
    );
  }

  const getAssetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'native': return <Coins size={32} />;
      case 'psp22': return <Hexagon size={32} />;
      case 'psp34': return <Database size={32} />;
      case 'psp37': return <Database size={32} />;
      default: return <Coins size={32} />;
    }
  };

  const getAssetColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'native': return '#26D07C';
      case 'psp22': return '#7B42FF';
      case 'psp34': return '#FE5F00';
      case 'psp37': return '#007AFF';
      default: return '#6B7280';
    }
  };

  const degradedLevel = getIndexerDegradedLevel(health.rpc.latestBlock, health.indexer.latestBlock, !!assetError);

  return (
    <div className={styles.container}>
      {degradedLevel && (
        <DegradedBanner level={degradedLevel} source="Indexer" />
      )}
      {/* Header */}
      <div className={styles.header}>
        <Link to="/assets" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to Assets
        </Link>
        {id && (
          <WatchlistButton
            isWatched={isWatched(id, 'token')}
            onToggle={() => toggleItem({ id, type: 'token', name: asset?.name || undefined, symbol: asset?.symbol || undefined })}
          />
        )}
      </div>

      {/* Asset Hero */}
      <div className={styles.hero}>
        <div 
          className={styles.assetIcon}
          style={{ 
            backgroundColor: `${getAssetColor(asset.assetType)}20`,
            color: getAssetColor(asset.assetType)
          }}
        >
          {project?.logoUrl ? (
            <img src={project.logoUrl} alt={asset.name || ''} className={styles.logoImage} />
          ) : (
            getAssetIcon(asset.assetType)
          )}
        </div>
        <div className={styles.assetInfo}>
          <div className={styles.assetHeader}>
            <h1 className={styles.assetName}>{asset.name || 'Unnamed Asset'}</h1>
            {asset.verified && (
              <StatusBadge status="success" size="sm">
                <CheckCircle size={14} /> Verified
              </StatusBadge>
            )}
          </div>
          <span className={styles.assetSymbol}>{asset.symbol || '???'}</span>
          <DataSourceBadge source="INDEXER" updatedAt={`Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`} health={degradedToHealth(degradedLevel)} />
          <span 
            className={styles.assetType}
            style={{ 
              backgroundColor: `${getAssetColor(asset.assetType)}20`,
              color: getAssetColor(asset.assetType)
            }}
          >
            {asset.assetType}
          </span>
        </div>
      </div>

      {/* Project Info Section */}
      {project ? (
        <Card title="Project Information" icon={<Globe size={18} />}>
          <div className={styles.projectInfo}>
            {project.description && (
              <p className={styles.description}>{project.description}</p>
            )}
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Category</span>
                <span className={styles.detailValue}>{project.category}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Created</span>
                <span className={styles.detailValue}>
                  {new Date(Number(project.createdAt)).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Created By</span>
                <CopyToClipboard 
                  text={project.createdBy} 
                  truncate 
                  truncateLength={8}
                />
              </div>
            </div>

            {/* Social Links */}
            <div className={styles.socialLinks}>
              {project.website && (
                <a 
                  href={project.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Globe size={18} />
                  Website
                </a>
              )}
              {project.whitepaper && (
                <a 
                  href={project.whitepaper} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <FileText size={18} />
                  Whitepaper
                </a>
              )}
              {project.github && (
                <a 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Github size={18} />
                  GitHub
                </a>
              )}
              {project.twitter && (
                <a 
                  href={project.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Twitter size={18} />
                  Twitter
                </a>
              )}
              {project.discord && (
                <a 
                  href={project.discord} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <MessageCircle size={18} />
                  Discord
                </a>
              )}
              {project.telegram && (
                <a 
                  href={project.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <Send size={18} />
                  Telegram
                </a>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Project Information" icon={<Globe size={18} />}>
          <EmptyState 
            type="no-data" 
            message="No project information registered for this asset"
            action={{ 
              label: 'Register Project', 
              onClick: () => window.location.href = `/project/register?assetId=${asset.id}` 
            }}
          />
        </Card>
      )}

      {/* Asset Details */}
      <div className={styles.detailsGrid}>
        <Card title="Token Details" icon={<Coins size={18} />}>
          <div className={styles.tokenDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Asset ID</span>
              <CopyToClipboard text={asset.id} truncate truncateLength={12} />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Type</span>
              <span className={styles.detailValue}>{asset.assetType}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Symbol</span>
              <span className={styles.detailValue}>{asset.symbol || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Decimals</span>
              <span className={styles.detailValue}>{asset.decimals ?? '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Supply</span>
              <span className={styles.detailValue}>
                {asset.totalSupply ? 
                  (parseInt(asset.totalSupply) / Math.pow(10, asset.decimals || 0)).toLocaleString() : 
                  '-'
                }
              </span>
            </div>
            {asset.contractAddress && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Contract</span>
                <CopyToClipboard text={asset.contractAddress} truncate truncateLength={8} />
              </div>
            )}
          </div>
        </Card>

        <Card title="Verification" icon={<CheckCircle size={18} />}>
          <div className={styles.verificationInfo}>
            {asset.verified ? (
              <>
                <div className={styles.verifiedBadgeLarge}>
                  <CheckCircle size={48} />
                  <span>Verified Asset</span>
                </div>
                <p className={styles.verificationText}>
                  This asset has been verified by the Lunes network. Verification ensures 
                  the authenticity and legitimacy of the project.
                </p>
              </>
            ) : (
              <>
                <div className={styles.unverifiedBadgeLarge}>
                  <AlertCircle size={48} />
                  <span>Unverified Asset</span>
                </div>
                <p className={styles.verificationText}>
                  This asset has not been verified yet. Please exercise caution and 
                  do your own research before interacting with it.
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AssetDetail;
