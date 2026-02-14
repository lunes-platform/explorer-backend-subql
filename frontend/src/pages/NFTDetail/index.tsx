import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@apollo/client/react';
import { 
  ArrowLeft, 
  Image, 
  Database,
  Globe,
  FileText,
  Github,
  Twitter,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  Layers
} from 'lucide-react';
import { GET_NFT_COLLECTION, GET_PROJECT } from '../../services/graphql/queries';
import Card from '../../components/common/Card';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import DataSourceBadge from '../../components/common/DataSourceBadge';
import type { NFTCollection, GetProjectResponse } from '../../types';
import styles from './NFTDetail.module.css';

const NFTDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: nftData, loading: nftLoading, error: nftError } = 
    useQuery<{ psp34Collection: NFTCollection | null }>(GET_NFT_COLLECTION, {
      variables: { id },
      skip: !id
    });

  const { data: projectData } = 
    useQuery<GetProjectResponse>(GET_PROJECT, {
      variables: { id },
      skip: !id
    });

  const loading = nftLoading;
  const error = nftError;

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

  const collection = nftData?.psp34Collection;
  const project = projectData?.project;
  
  if (!collection) {
    return (
      <div className={styles.container}>
        <EmptyState
          type="no-data"
          message="NFT Collection not found"
          action={{ label: 'View All NFTs', onClick: () => window.location.href = '/nfts' }}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link to="/nfts" className={styles.backLink}>
          <ArrowLeft size={18} />
          Back to NFTs
        </Link>
      </div>

      {/* Collection Hero */}
      <div className={styles.hero}>
        <div className={styles.collectionIcon}>
          {project?.logoUrl ? (
            <img src={project.logoUrl} alt={collection.name || ''} className={styles.logoImage} />
          ) : (
            <Image size={40} />
          )}
        </div>
        <div className={styles.collectionInfo}>
          <div className={styles.collectionHeader}>
            <h1 className={styles.collectionName}>{collection.name || 'Unnamed Collection'}</h1>
            <span className={styles.collectionSymbol}>{collection.symbol || '???'}</span>
          </div>
          <DataSourceBadge source="INDEXER" updatedAt={`Updated ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`} />
          <div className={styles.collectionStats}>
            <div className={styles.stat}>
              <Layers size={16} />
              <span>{collection.totalSupply?.toLocaleString() || '0'} Items</span>
            </div>
            {collection.contractAddress && (
              <div className={styles.stat}>
                <span>Contract:</span>
                <CopyToClipboard text={collection.contractAddress} truncate truncateLength={8} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Info Section */}
      {project ? (
        <Card title="Collection Information" icon={<Globe size={18} />}>
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
                <span className={styles.detailLabel}>Creator</span>
                <CopyToClipboard 
                  text={project.createdBy} 
                  truncate 
                  truncateLength={8}
                />
              </div>
            </div>

            <div className={styles.socialLinks}>
              {project.website && (
                <a href={project.website} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <Globe size={18} /> Website
                </a>
              )}
              {project.twitter && (
                <a href={project.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <Twitter size={18} /> Twitter
                </a>
              )}
              {project.discord && (
                <a href={project.discord} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <MessageCircle size={18} /> Discord
                </a>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Collection Information" icon={<Globe size={18} />}>
          <EmptyState 
            type="no-data" 
            message="No project information registered for this collection"
            action={{ 
              label: 'Register Project', 
              onClick: () => window.location.href = `/project/register?assetId=${collection.id}` 
            }}
          />
        </Card>
      )}

      {/* NFTs Grid */}
      <Card title="NFTs in Collection" icon={<Layers size={18} />}>
        <EmptyState 
          type="no-data" 
          message="NFT browser coming soon - backend indexing in progress"
        />
      </Card>
    </div>
  );
};

export default NFTDetail;
