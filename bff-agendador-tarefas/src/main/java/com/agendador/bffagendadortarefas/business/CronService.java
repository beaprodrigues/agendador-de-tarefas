package com.agendador.bffagendadortarefas.business;

import com.agendador.bffagendadortarefas.business.dto.in.LoginRequestDTO;
import com.agendador.bffagendadortarefas.business.dto.out.TarefasDTOResponse;
import com.agendador.bffagendadortarefas.business.enums.StatusNotificacaoEnum;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CronService {

    private final TarefasService tarefasService;
    private final EmailService emailService;
    private final UsuarioService usuarioService;

    @Value("${usuario.email}")
    private String email;

    @Value("${usuario.senha}")
    private String senha;

    @Scheduled(cron = "${cron.horario}")
    public void buscaTarefasProximaHora() {
        try {
            String token = login(converterParaRequestDTO());
            log.info("Iniciada a busca de tarefas agendadas para a próxima hora");

            LocalDateTime horaFutura = LocalDateTime.now().plusHours(1);
            LocalDateTime horaFuturaMaisCinco = horaFutura.plusMinutes(5);

            List<TarefasDTOResponse> listaTarefas = tarefasService.buscaTarefasAgendadasPorPeriodo(
                    horaFutura, horaFuturaMaisCinco, token);
            log.info("Tarefas encontradas: {}", listaTarefas.size());

            listaTarefas.forEach(tarefa -> {
                try {
                    emailService.enviaEmail(tarefa);
                    log.info("Email enviado para o usuário: {}", tarefa.getEmailUsuario());
                    tarefasService.alteraStatus(StatusNotificacaoEnum.NOTIFICADO, tarefa.getId(), token);
                } catch (Exception ex) {
                    log.error("Falha ao notificar tarefa {}: {}", tarefa.getId(), ex.getMessage());
                }
            });

            log.info("Finalizada a busca e notificação de tarefas");
        } catch (Exception e) {
            log.warn("Execução do agendador ignorada (serviço de usuário indisponível ou usuário cron não cadastrado): {}", e.getMessage());
        }
    }

    public String login(LoginRequestDTO dto) {
        return usuarioService.loginUsuario(dto);
    }

    public LoginRequestDTO converterParaRequestDTO() {
        return LoginRequestDTO.builder()
                .email(email)
                .senha(senha)
                .build();
    }
}
