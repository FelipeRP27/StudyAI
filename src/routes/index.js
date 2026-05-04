const express = require('express');
const alternativaRoutes = require('./alternativaRoutes');
const authRoutes = require('./authRoutes');
const conteudoRoutes = require('./conteudoRoutes');
const desempenhoRoutes = require('./desempenhoRoutes');
const flashcardRoutes = require('./flashcardRoutes');
const materiaRoutes = require('./materiaRoutes');
const pontoChaveRoutes = require('./pontoChaveRoutes');
const processamentoRoutes = require('./processamentoRoutes');
const protectedRoutes = require('./protectedRoutes');
const questaoRoutes = require('./questaoRoutes');
const respostaRoutes = require('./respostaRoutes');
const resumoRoutes = require('./resumoRoutes');
const tarefaRoutes = require('./tarefaRoutes');

const router = express.Router();

router.use('/alternativas', alternativaRoutes);
router.use('/auth', authRoutes);
router.use('/conteudos', conteudoRoutes);
router.use('/desempenho', desempenhoRoutes);
router.use('/flashcards', flashcardRoutes);
router.use('/materias', materiaRoutes);
router.use('/pontos-chave', pontoChaveRoutes);
router.use('/processamentos', processamentoRoutes);
router.use('/protected', protectedRoutes);
router.use('/questoes', questaoRoutes);
router.use('/respostas', respostaRoutes);
router.use('/resumos', resumoRoutes);
router.use('/tarefas', tarefaRoutes);

module.exports = router;
