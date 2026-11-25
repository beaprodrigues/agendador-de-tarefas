package com.agendador.agendadortarefas.business;

import com.agendador.agendadortarefas.business.dto.TarefasDTO;
import com.agendador.agendadortarefas.business.mapper.TarefaUpdateConverter;
import com.agendador.agendadortarefas.business.mapper.TarefasConverter;
import com.agendador.agendadortarefas.infrastructure.entity.TarefasEntity;
import com.agendador.agendadortarefas.infrastructure.enums.StatusNotificacaoEnum;
import com.agendador.agendadortarefas.infrastructure.exceptions.ResourceNotFoundException;
import com.agendador.agendadortarefas.infrastructure.repository.TarefasRepository;
import com.agendador.agendadortarefas.infrastructure.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TarefasService {

    private final TarefasRepository tarefasRepository;
    private final TarefasConverter tarefaConverter;
    private final JwtUtil jwtUtil;
    private final TarefaUpdateConverter tarefaUpdateConverter;

    public TarefasDTO gravarTarefa(String token, TarefasDTO dto) {
        String email = jwtUtil.extrairEmailToken(token);
        dto.setDataCriacao(LocalDateTime.now());
        dto.setStatusNotificacaoEnum(StatusNotificacaoEnum.PENDENTE);
        dto.setEmailUsuario(email);
        TarefasEntity entity = tarefaConverter.paraTarefaEntity(dto);
        return tarefaConverter.paraTarefaDTO(tarefasRepository.save(entity));
    }

    public List<TarefasDTO> buscaTarefasAgendadasPorPeriodo(LocalDateTime dataInicial, LocalDateTime dataFinal) {
        return tarefaConverter.paraListaTarefasDTO(
                tarefasRepository.findByDataEventoBetweenAndStatusNotificacaoEnum(
                        dataInicial, dataFinal, StatusNotificacaoEnum.PENDENTE
                )
        );
    }

    public List<TarefasDTO> buscaTarefasPorEmail(String token) {
        String email = jwtUtil.extrairEmailToken(token);
        List<TarefasEntity> listaTarefas = tarefasRepository.findByEmailUsuario(email);
        return tarefaConverter.paraListaTarefasDTO(listaTarefas);
    }

    public void deletaTarefaPorId(String id) {
        if (!tarefasRepository.existsById(id)) {
            throw new ResourceNotFoundException("Erro ao deletar tarefa: id inexistente " + id);
        }
        tarefasRepository.deleteById(id);
    }

    public TarefasDTO alteraStatus(StatusNotificacaoEnum status, String id) {
        TarefasEntity entity = tarefasRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada com id: " + id));
        entity.setStatusNotificacaoEnum(status);
        entity.setDataAlteracao(LocalDateTime.now());
        return tarefaConverter.paraTarefaDTO(tarefasRepository.save(entity));
    }

    public TarefasDTO updateTarefas(TarefasDTO dto, String id) {
        TarefasEntity entity = tarefasRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada com id: " + id));
        tarefaUpdateConverter.updateTarefas(dto, entity);
        entity.setDataAlteracao(LocalDateTime.now());
        return tarefaConverter.paraTarefaDTO(tarefasRepository.save(entity));
    }
}
