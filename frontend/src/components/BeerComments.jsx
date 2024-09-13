import { useState, useEffect, useCallback } from 'react';
import { Button, Form, ListGroup, Badge } from 'react-bootstrap';
import { HandThumbsUp, Pencil, Trash, Reply } from 'react-bootstrap-icons';
import { getComments, addComment, updateComment, deleteComment } from '../services/api';

export default function BeerComments({ beerId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [userLikes, setUserLikes] = useState({});

  const fetchComments = useCallback(async () => {
    try {
      const commentsData = await getComments(beerId);
      setComments(commentsData);
      const initialLikes = commentsData.reduce((acc, comment) => {
        acc[comment._id] = 0;
        return acc;
      }, {});
      setUserLikes(initialLikes);
    } catch (error) {
      console.error('Errore nel caricamento dei commenti:', error);
    }
  }, [beerId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Effettua il login per commentare");
      return;
    }
    try {
      const response = await addComment({ beerId, content: newComment });
      setComments(prevComments => [...prevComments, response]);
      setNewComment('');
    } catch (error) {
      console.error('Errore nella creazione del commento:', error);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      await updateComment(commentId, { content: newContent });
      setComments(prevComments => prevComments.map(comment => 
        comment._id === commentId ? { ...comment, content: newContent } : comment
      ));
      setEditingCommentId(null);
    } catch (error) {
      console.error('Errore nella modifica del commento:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
    } catch (error) {
      console.error('Errore nell\'eliminazione del commento:', error);
    }
  };

  const handleReply = async (parentId, content) => {
    if (!currentUser) {
      alert("Effettua il login per rispondere");
      return;
    }
    try {
      const response = await addComment({ beerId, content, parentId });
      setComments(prevComments => [...prevComments, response]);
      setReplyingToId(null);
    } catch (error) {
      console.error('Errore nella risposta al commento:', error);
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

  const CommentAuthor = ({ user }) => (
    <small>
      By: {user.name} {user.role === 'admin' && <Badge bg="warning">Admin</Badge>}
    </small>
  );

  return (
    <div>
      <h5>Commenti</h5>
      <ListGroup>
        {comments.map((comment) => (
          <ListGroup.Item key={comment._id}>
            {editingCommentId === comment._id ? (
              <Form onSubmit={(e) => {
                e.preventDefault();
                handleEditComment(comment._id, e.target.content.value);
              }}>
                <Form.Control name="content" defaultValue={comment.content} />
                <Button type="submit">Salva</Button>
                <Button variant="secondary" onClick={() => setEditingCommentId(null)}>Annulla</Button>
              </Form>
            ) : (
              <>
                <p>{comment.content}</p>
                <CommentAuthor user={comment.user} />
                <Button variant="link" onClick={() => handleLikeComment(comment._id)}>
                  <HandThumbsUp /> {(comment.likes ? comment.likes.length : 0) + (userLikes[comment._id] || 0)}
                </Button>
                {isCurrentUserAuthor(comment.user._id) && (
                  <>
                    <Button variant="link" onClick={() => setEditingCommentId(comment._id)}>
                      <Pencil />
                    </Button>
                    <Button variant="link" onClick={() => handleDeleteComment(comment._id)}>
                      <Trash />
                    </Button>
                  </>
                )}
                <Button variant="link" onClick={() => setReplyingToId(comment._id)}>
                  <Reply /> Rispondi
                </Button>
                {replyingToId === comment._id && (
                  <Form onSubmit={(e) => {
                    e.preventDefault();
                    handleReply(comment._id, e.target.content.value);
                  }}>
                    <Form.Control name="content" placeholder="La tua risposta" />
                    <Button type="submit">Invia risposta</Button>
                    <Button variant="secondary" onClick={() => setReplyingToId(null)}>Annulla</Button>
                  </Form>
                )}
              </>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
      <Form onSubmit={handleSubmitComment}>
        <Form.Group>
          <Form.Control
            as="textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Aggiungi un commento"
            disabled={!currentUser}
          />
        </Form.Group>
        <Button type="submit" disabled={!currentUser}>
          {currentUser ? "Invia commento" : "Effettua il login per commentare"}
        </Button>
      </Form>
    </div>
  );
}