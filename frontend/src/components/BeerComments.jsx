import { useState, useEffect, useCallback } from 'react';
import { Button, Form, Card, Badge } from 'react-bootstrap';
import { HandThumbsUp, Pencil, Trash, Reply } from 'react-bootstrap-icons';
import { getComments, addComment, updateComment, deleteComment } from '../services/api';

export default function BeerComments({ beerId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [userLikes, setUserLikes] = useState({});

  const fetchComments = useCallback(async () => {
    try {
      const commentsData = await getComments(beerId);
      console.log('Commenti ricevuti:', commentsData);
      setComments(commentsData);
      const initialLikes = commentsData.reduce((acc, comment) => {
        acc[comment._id] = 0;
        return acc;
      }, {});
      setUserLikes(initialLikes);
    } catch (error) {
      console.error('Errore nel caricamento dei commenti:', error);
      setComments([]);
      setUserLikes({});
    }
  }, [beerId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e, parentId = null) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Effettua il login per commentare");
      return;
    }
    const content = parentId ? e.target.content.value : newComment;
    try {
      const commentData = { beerId, content, parentId };
      const response = await addComment(commentData);
      if (parentId) {
        setComments(prevComments => prevComments.map(comment => 
          comment._id === parentId
            ? { ...comment, replies: [...(comment.replies || []), response] }
            : comment
        ));
        setReplyingToId(null);
      } else {
        setComments(prevComments => [response, ...prevComments]);
        setNewComment('');
      }
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Errore nella creazione del commento:', error);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      const updatedComment = await updateComment(commentId, { content: newContent });
      setComments(prevComments => prevComments.map(comment => 
        comment._id === commentId ? { ...comment, content: updatedComment.content } : 
        comment.replies ? {
          ...comment,
          replies: comment.replies.map(reply =>
            reply._id === commentId ? { ...reply, content: updatedComment.content } : reply
          )
        } : comment
      ));
      setEditingCommentId(null);
    } catch (error) {
      console.error('Errore nella modifica del commento:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prevComments => prevComments.filter(comment => {
        if (comment._id === commentId) return false;
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply._id !== commentId);
        }
        return true;
      }));
    } catch (error) {
      console.error('Errore nell\'eliminazione del commento:', error);
    }
  };

  const handleLikeComment = (commentId) => {
    if (!currentUser) {
      alert("Effettua il login per mettere mi piace");
      return;
    }
    setUserLikes(prevLikes => {
      const currentLikes = prevLikes[commentId] || 0;
      return { ...prevLikes, [commentId]: currentLikes === 0 ? 1 : 0 };
    });
  };

  const isCurrentUserAuthor = useCallback((userId) => {
    return currentUser && currentUser._id === userId;
  }, [currentUser]);

  const CommentAuthor = ({ user }) => {
    console.log('User data:', user);
    if (!user) return null;
    return (
      <small className="d-flex align-items-center">
        By: {user.name} 
        {user.role === 'admin' && (
          <Badge bg="warning" text="dark" className="ms-2">
            Admin
          </Badge>
        )}
      </small>
    );
  };

  const renderComment = (comment, isReply = false) => (
    <Card key={comment._id} className={`mb-3 ${isReply ? 'ms-4' : ''}`}>
      <Card.Body className={isReply ? 'py-2 bg-light' : ''}>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="mb-1">{comment.content}</p>
            <CommentAuthor user={comment.user} />
          </div>
          <div>
            <Button variant="link" className="p-0 me-2" onClick={() => handleLikeComment(comment._id)}>
              <HandThumbsUp /> {(comment.likes ? comment.likes.length : 0) + (userLikes[comment._id] || 0)}
            </Button>
            {isCurrentUserAuthor(comment.user?._id) && (
              <Button variant="link" className="p-0 me-2" onClick={() => setEditingCommentId(comment._id)}>
                <Pencil />
              </Button>
            )}
            {(isCurrentUserAuthor(comment.user?._id) || currentUser?.role === 'admin') && (
              <Button variant="link" className="p-0 me-2" onClick={() => handleDeleteComment(comment._id)}>
                <Trash />
              </Button>
            )}
            {!isReply && (
              <Button variant="link" className="p-0" onClick={() => setReplyingToId(comment._id)}>
                <Reply /> Rispondi
              </Button>
            )}
          </div>
        </div>
        {editingCommentId === comment._id && (
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleEditComment(comment._id, e.target.content.value);
          }} className="mt-2">
            <Form.Control name="content" defaultValue={comment.content} />
            <Button type="submit" variant="primary" size="sm" className="mt-2 me-2">Salva</Button>
            <Button variant="secondary" size="sm" onClick={() => setEditingCommentId(null)} className="mt-2">Annulla</Button>
          </Form>
        )}
        {replyingToId === comment._id && (
          <Form onSubmit={(e) => handleSubmitComment(e, comment._id)} className="mt-2">
            <Form.Control name="content" placeholder="La tua risposta" />
            <Button type="submit" variant="primary" size="sm" className="mt-2 me-2">Invia risposta</Button>
            <Button variant="secondary" size="sm" onClick={() => setReplyingToId(null)} className="mt-2">Annulla</Button>
          </Form>
        )}
      </Card.Body>
      {comment.replies && comment.replies.length > 0 && (
        <Card.Footer className="p-0">
          {comment.replies.map(reply => renderComment(reply, true))}
        </Card.Footer>
      )}
    </Card>
  );

  return (
    <div>
      <h5>Commenti</h5>
      <Form onSubmit={(e) => handleSubmitComment(e)} className="mb-3">
        <Form.Group>
          <Form.Control
            as="textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Aggiungi un commento"
            disabled={!currentUser}
          />
        </Form.Group>
        <Button type="submit" className='mt-2' disabled={!currentUser}>
          {currentUser ? "Invia commento" : "Effettua il login per commentare"}
        </Button>
      </Form>
      {comments.length > 0 ? (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      ) : (
        <p>Nessun commento disponibile.</p>
      )}
    </div>
  );
}