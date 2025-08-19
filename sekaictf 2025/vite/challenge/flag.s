.global _start
.text
    _start:
        /* write(STDOUT_FILENO, flag, flag_len); */
        xor %rax,%rax
        inc %al
        mov %rax,%rdi
        mov $flag,%rsi
        mov $flag_len,%rdx
        syscall

        /* exit(0); */
        mov $0x3c,%al
        xor %rdi,%rdi
        syscall

    flag: .ascii "SEKAI{p0llu71ng_pr0707yp35_1n_v173_w45_7h3_k3y_70_rc3_4nd_y0u_m4n493d_70_p1ck_7h3_n33dl3_fr0m_7h3_h4y574ck}\n"
    .set flag_len, .-flag
