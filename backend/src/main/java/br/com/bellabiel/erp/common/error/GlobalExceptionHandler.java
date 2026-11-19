package br.com.bellabiel.erp.common.error;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Erros padronizados (RFC 7807). Nunca devolve stack trace nem mensagem interna; o {@code traceId}
 * permite correlacionar com o log do servidor.
 */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  record CampoInvalido(String field, String message) {}

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Dados inválidos.");
    pd.setTitle("Validação falhou");
    pd.setType(URI.create("urn:bellabiel:problem:validacao"));
    List<CampoInvalido> erros =
        ex.getBindingResult().getFieldErrors().stream()
            .map(f -> new CampoInvalido(f.getField(), f.getDefaultMessage()))
            .toList();
    pd.setProperty("errors", erros);
    return handleExceptionInternal(ex, pd, headers, HttpStatus.BAD_REQUEST, request);
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
    String traceId = UUID.randomUUID().toString();
    log.error("Erro inesperado traceId={}", traceId, ex);
    ProblemDetail pd =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno. Informe o código de rastreio.");
    pd.setTitle("Erro interno");
    pd.setProperty("traceId", traceId);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(pd);
  }
}
